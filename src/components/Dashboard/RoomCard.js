import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EnterIcon from "@mui/icons-material/Login";

const RoomCard = ({ room, onDelete, onJoin, currentUser }) => {
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(room.roomId);
  };

  return (
    <Card
      variant="outlined"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Typography variant="h6" component="div" gutterBottom noWrap>
            {room.name}
          </Typography>

          {room.createdBy && room.createdBy.username === currentUser && (
            <Tooltip title="Delete Room">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(room._id)}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Room ID:
          </Typography>
          <Typography
            variant="body2"
            component="div"
            sx={{
              maxWidth: "140px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {room.roomId}
          </Typography>
          <Tooltip title="Copy Room ID">
            <IconButton size="small" onClick={handleCopyRoomId}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Created by:
          </Typography>
          <Typography variant="body2">
            {room.createdBy?.username || "Unknown"}
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Participants: {room.participants.length}
          </Typography>
        </Box>

        <Box sx={{ mt: 1 }}>
          <Chip
            size="small"
            label={
              <Typography variant="caption">
                Created: {new Date(room.createdAt).toLocaleDateString()}
              </Typography>
            }
          />
        </Box>
      </CardContent>

      <CardActions>
        <Button
          variant="contained"
          fullWidth
          startIcon={<EnterIcon />}
          onClick={onJoin}
        >
          Join Whiteboard
        </Button>
      </CardActions>
    </Card>
  );
};

export default RoomCard;
