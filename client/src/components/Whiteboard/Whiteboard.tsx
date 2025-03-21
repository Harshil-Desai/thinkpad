import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Tldraw,
  Editor,
  DefaultColorStyle,
  exportToBlob,
} from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import styles from "./Whiteboard.module.css";
import { useWhiteboard } from "../Context/WhiteboardContext";
import { useParams } from "react-router-dom";
import axios from "axios";
import { throttle } from "@tldraw/tldraw";

const Whiteboard: React.FC = () => {
  const { currentTool, currentColor, setCurrentColor } = useWhiteboard();
  const [editor, setEditor] = useState<Editor | null>(null);
  const { boardId } = useParams<{ boardId: string }>();
  const [boardData, setBoardData]: any = useState(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  // Fetch board data
  const fetchBoard = async () => {
    try {
      const response = await axios.get(`/api/boards/${boardId}`);
      setBoardData(response.data);

      if (editor && response.data.canvasData) {
        const snapshot = JSON.parse(response.data.canvasData);
        console.log("Loading snapshot:", snapshot);
        editor.loadSnapshot(snapshot);
      }

      setIsInitializing(false);
    } catch (err) {
      console.error("Failed to fetch board:", err);
    }
  };

  // Handle WebSocket connection and editor mount
  const handleMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);

    const socket = new WebSocket(`ws://localhost:5000`);
    socket.onopen = () => {
      console.log("Connected to WebSocket");
    };

    socket.onmessage = async (event) => {
      let data;

      if (event.data instanceof Blob) {
        data = await event.data.text();
      } else {
        data = event.data;
      }

      try {
        const incomingDocument = JSON.parse(data);
        if (editorInstance && incomingDocument) {
          const currentSnapshot = editorInstance.getSnapshot();
          const updatedSnapshot = {
            ...currentSnapshot,
            document: incomingDocument,
          };
          editorInstance.loadSnapshot(updatedSnapshot);
        }
      } catch (err) {
        console.error("Failed to parse document data:", err, data);
      }
    };

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, []);

  // Save the canvas as an image and upload it to the server
  const saveCanvasAsImage = async () => {
    if (!editor) return;

    let shapeIds = editor.getCurrentPageShapeIds();
    if (shapeIds.size !== 0) {
      const blob = await exportToBlob({
        editor: editor,
        ids: [...shapeIds],
        format: "png",
        opts: { background: false },
      });
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result;

        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `/api/boards/${boardId}/thumbnail`,
            { image: base64data },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Update the board's thumbnail URL in the database
          const thumbnailUrl = response.data.thumbnailUrl;
          await axios.put(
            `/api/boards/${boardId}`,
            { thumbnail: thumbnailUrl },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          console.log("Thumbnail saved:", thumbnailUrl);
        } catch (err) {
          console.error("Failed to save thumbnail:", err);
        }
      };
    } else {
      const token = localStorage.getItem("token");
      const thumbnailUrl = "../../uploads/thumbnail_whitebackground.png";
      await axios.put(
        `/api/boards/${boardId}`,
        { thumbnail: thumbnailUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Thumbnail saved:", thumbnailUrl);
    }
  };

  // Save the canvas periodically (e.g., every 10 seconds)
  useEffect(() => {
    if (!editor) return;

    const interval = setInterval(() => {
      saveCanvasAsImage();
    }, 5000); // Save every 10 seconds

    return () => clearInterval(interval);
  }, [editor]);

  // Fetch board data when the editor is ready
  useEffect(() => {
    fetchBoard();
  }, [editor]);

  // Handle WebSocket document updates
  useEffect(() => {
    if (editor) {
      const sendDocument = throttle((document: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify(document));
        }
      }, 100);

      const saveSnapshot = throttle((snapshot: any) => {
        axios
          .put(`/api/boards/${boardId}`, {
            canvasData: JSON.stringify(snapshot),
          })
          .catch((err) => console.error("Failed to save canvas data:", err));
      }, 1000);

      const handleChange = () => {
        const snapshot = editor.getSnapshot();
        const document = snapshot.document;

        saveSnapshot(snapshot);
        sendDocument(document);
      };

      editor.on("change", handleChange);

      return () => {
        editor.off("change", handleChange);
      };
    }
  }, [editor, boardId]);

  // Sync the current tool with the editor
  useEffect(() => {
    if (editor) {
      editor.setCurrentTool(currentTool);
    }
  }, [editor, currentTool]);

  // Sync the current color with the editor
  useEffect(() => {
    if (editor && currentColor) {
      editor.setStyleForNextShapes(DefaultColorStyle, currentColor);
    }
  }, [editor, currentColor]);

  // Listen for color changes in the editor
  useEffect(() => {
    if (editor) {
      const handleColorChange = () => {
        const styles = editor.getStyleForNextShape(DefaultColorStyle);
        if (styles && styles !== currentColor) {
          setCurrentColor(styles);
        }
      };

      editor.on("change", handleColorChange);

      return () => {
        editor.off("change", handleColorChange);
      };
    }
  }, [editor, currentColor, setCurrentColor]);

  // Clean up WebSocket connection
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div className={styles.whiteboardContainer}>
      {boardData ? (
        <>
          <h2>{boardData.name}</h2>
          <p>Shared With: {boardData.sharedWith.join(", ")}</p>
          <Tldraw onMount={handleMount} persistenceKey={boardId}></Tldraw>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Whiteboard;
