import React from "react";
import { Editor, exportToBlob } from "@tldraw/tldraw";
import styles from "./Toolbar.module.css";

interface ToolbarProps {
  editor: Editor | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  const setTool = (tool: string) => {
    editor.setCurrentTool(tool);
  };

  const undo = () => {
    editor.undo();
  };

  const redo = () => {
    editor.redo();
  };

  const saveImage = async () => {
    if (!editor) return;

    const shapeIds = editor.getCurrentPageShapeIds();
    if (shapeIds.size > 0) {
      const blob = await exportToBlob({
        editor,
        ids: [...shapeIds],
        format: "png",
        opts: { background: true },
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "whiteboard.png";
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={styles.toolbar}>
      <button onClick={() => setTool("select")}>Select</button>
      <button onClick={() => setTool("pencil")}>Pencil</button>
      <button onClick={() => setTool("text")}>Text</button>
      <button onClick={() => setTool("select.eraser")}>Trying</button>
      <button onClick={() => setTool("circle")}>Circle</button>
      <button onClick={() => setTool("line")}>Line</button>
      <button onClick={() => setTool("arrow")}>Arrow</button>
      <button onClick={() => setTool("eraser")}>Eraser</button>
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
      <button onClick={saveImage}>Save as Image</button>
    </div>
  );
};

export default Toolbar;
