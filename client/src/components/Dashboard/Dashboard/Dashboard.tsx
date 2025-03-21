import axios from "axios";
import React, { useEffect, useState } from "react";
import BoardCard from "../BoardCard/BoardCard";
import styles from "./Dashboard.module.css";
import useDebounce from "../../../hooks/useDebounce";

const Dashboard: React.FC = () => {
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchBoards = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    try {
      const response = await axios.get(`/api/boards/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBoards(response.data);
    } catch (err) {
      console.error("Error fetching boards:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserName = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    console.log("fetchUserName called");
    try {
      const response = await axios.get(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserName(response.data.username);
    } catch (err) {
      console.error("Error fetching user name:", err);
    }
  };

  useEffect(() => {
    fetchBoards();
    debouncedFn();
    debouncedFn();
    debouncedFn();
    debouncedFn();
    debouncedFn();
    debouncedFn();
    debouncedFn();
  }, []);

  const handleCreateBoard = async () => {
    const newBoard = {
      name: "Untitled Board",
      canvasData: "",
      createdBy: localStorage.getItem("userId"),
    };
    try {
      const response = await axios.post("/api/boards", newBoard);
      setBoards((prev) => [...prev, response.data.data]);
    } catch (err) {
      console.error("Error creating board:", err);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`/api/boards/${boardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBoards((prevBoards) =>
        prevBoards.filter((board) => board._id !== boardId)
      );
    } catch (err) {
      console.error("Error deleting board:", err);
    }
  };

  const filteredBoards = boards.filter((board) => {
    const matchesSearch = board.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (filter === "shared") {
      return matchesSearch && board.sharedWith && board.sharedWith.length > 0;
    } else if (filter === "private") {
      return (
        matchesSearch && (!board.sharedWith || board.sharedWith.length === 0)
      );
    }
    return matchesSearch;
  });

  const handleRenameBoard = async (boardId: string, newName: string) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `/api/boards/${boardId}`,
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBoards((prevBoards) =>
        prevBoards.map((board) =>
          board._id === boardId ? { ...board, name: newName } : board
        )
      );
    } catch (err) {
      console.error("Error renaming board:", err);
    }
  };

  const handleAddCollaborator = async (boardId: string, email: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.put(
        `/api/boards/share/${boardId}`,
        { sharedWith: email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBoards((prevBoards) =>
        prevBoards.map((board) =>
          board._id === boardId
            ? { ...board, sharedWith: response.data.sharedWith }
            : board
        )
      );
    } catch (err) {
      console.error("Error adding collaborator:", err);
    }
  };

  const debouncedFn = useDebounce(fetchUserName);

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>My Workspace</h1>
        <div className={styles.headerActions}>
          <input
            type="text"
            placeholder="Search boards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={styles.filterDropdown}
          >
            <option value="all">All Boards</option>
            <option value="shared">Shared with Me</option>
            <option value="private">Private</option>
          </select>
          <button className={styles.createButton} onClick={handleCreateBoard}>
            + New Board
          </button>
          {userName && (
            <p className={styles.loggedInUser}>Welcome, {userName}</p>
          )}
        </div>
      </header>
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading your workspace...</p>
        </div>
      ) : (
        <div className={styles.boardList}>
          {filteredBoards.length ? (
            filteredBoards.map((board) => (
              <BoardCard
                key={board._id}
                board={board}
                onClick={() => (window.location.href = `/boards/${board._id}`)}
                onDelete={handleDeleteBoard}
                onRename={handleRenameBoard}
                onAddCollaborator={handleAddCollaborator}
              />
            ))
          ) : (
            <div className={styles.noBoards}>
              <p>No boards found.</p>
              <p>Create a new board to get started!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
