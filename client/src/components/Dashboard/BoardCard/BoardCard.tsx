import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  IconButton,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupsIcon from "@mui/icons-material/Groups";
import EditIcon from "@mui/icons-material/Edit";
import axios from "axios";
import styles from "./BoardCard.module.css"; // Importing the CSS module

interface BoardCardProps {
  board: { _id: string; name: string; sharedWith: string[]; thumbnail: string };
  onClick: () => void;
  onDelete: (boardId: string) => void;
  onRename: (boardId: string, newName: string) => void;
  onAddCollaborator: (boardId: string, email: string) => void;
}

const BoardCard: React.FC<BoardCardProps> = ({
  board,
  onClick,
  onDelete,
  onRename,
  onAddCollaborator,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(board.name);
  const [isSharing, setIsSharing] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaboratorUsernames, setCollaboratorUsernames] = useState<string[]>(
    []
  );

  useEffect(() => {
    const fetchUsernames = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
          "/api/users/usernames",
          { userIds: board.sharedWith },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCollaboratorUsernames(response.data.usernames);
      } catch (err) {
        console.error("Error fetching usernames:", err);
      }
    };

    if (board.sharedWith?.length > 0) {
      fetchUsernames();
    }
  }, [board.sharedWith]);

  const handleRename = () => {
    if (newName.trim() !== board.name) {
      onRename(board._id, newName);
    }
    setIsEditing(false);
  };

  const handleAddCollaborator = () => {
    if (collaboratorEmail.trim()) {
      onAddCollaborator(board._id, collaboratorEmail);
      setCollaboratorEmail("");
      setIsSharing(false);
    }
  };

  return (
    <Card
      className={`${styles.card} ${isHovered ? styles.cardHovered : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className={styles.thumbnailContainer}>
        {board.thumbnail ? (
          <img
            src={`http://localhost:5000/uploads${board.thumbnail}`}
            alt={`${board.name} thumbnail`}
            className={`${styles.thumbnailImage} ${
              isHovered ? styles.thumbnailHovered : ""
            }`}
          />
        ) : (
          <div className={styles.thumbnailDefault}>
            <Typography variant="body1" className={styles.thumbnailDefaultText}>
              No Preview
            </Typography>
          </div>
        )}

        {isHovered && (
          <div
            className={styles.actionsContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              size="small"
              className={`${styles.iconButton} ${styles.iconButtonHover}`}
              onClick={(e) => {
                setIsSharing(true);
              }}
            >
              <GroupsIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              className={`${styles.iconButton} ${styles.iconButtonDeleteHover}`}
              onClick={() => onDelete(board._id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        )}
      </div>

      <CardContent className={styles.cardContent}>
        <div className={styles.boardNameContainer}>
          {isEditing ? (
            <TextField
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
              size="small"
              sx={{ width: "70%" }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Typography variant="body1">{board.name}</Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </div>
          )}
        </div>
        <Chip
          label={`${board.sharedWith?.length || 0} members`}
          size="small"
          variant="outlined"
          className={styles.chip}
        />
      </CardContent>

      <Dialog open={isSharing} onClose={() => setIsSharing(false)}>
        <DialogTitle>Share Board</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <div>
            <Typography variant="subtitle2" gutterBottom>
              Current Collaborators
            </Typography>
            <div className={styles.collaboratorList}>
              {collaboratorUsernames.map((username, index) => (
                <Chip key={index} label={username} size="small" />
              ))}
            </div>
          </div>
          <TextField
            fullWidth
            label="Enter collaborator's email"
            value={collaboratorEmail}
            onChange={(e) => setCollaboratorEmail(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button onClick={() => setIsSharing(false)}>Cancel</Button>
          <Button
            onClick={handleAddCollaborator}
            variant="contained"
            color="primary"
          >
            Add Collaborator
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default BoardCard;
