import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import useAuth from "../hooks/useAuth";
import { roomAPI } from "../../api";
import RoomCard from "./RoomCard";
import Loading from "../common/Loading";

const Dashboard = () => {
  const navigate = useNavigate();

  // Get current user from auth context
  const { currentUser } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create room dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Join room dialog
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const [joiningRoom, setJoiningRoom] = useState(false);

  // Fetch rooms when component mounts
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await roomAPI.getRooms();
      setRooms(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch rooms");
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      return;
    }

    setCreatingRoom(true);

    try {
      const res = await roomAPI.createRoom({ name: newRoomName });
      setRooms([...rooms, res.data.data]);
      setCreateDialogOpen(false);
      setNewRoomName("");

      // Navigate to the new room
      navigate(`/room/${res.data.data.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room");
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomIdToJoin.trim()) {
      return;
    }

    setJoiningRoom(true);

    try {
      const res = await roomAPI.joinRoom(roomIdToJoin);

      // Check if room is already in the list
      const roomExists = rooms.some((room) => room._id === res.data.data._id);

      if (!roomExists) {
        setRooms([...rooms, res.data.data]);
      }

      setJoinDialogOpen(false);
      setRoomIdToJoin("");

      // Navigate to the joined room
      navigate(`/room/${res.data.data.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join room");
    } finally {
      setJoiningRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      await roomAPI.deleteRoom(roomId);
      setRooms(rooms.filter((room) => room._id !== roomId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete room");
    }
  };

  if (loading) {
    return <Loading message="Loading rooms..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4">Welcome, {currentUser?.username}</Typography>

        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Create Room
          </Button>

          <Button variant="outlined" onClick={() => setJoinDialogOpen(true)}>
            Join Room
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ mb: 4 }} />

      <Typography variant="h5" sx={{ mb: 3 }}>
        Your Whiteboard Rooms
      </Typography>

      {rooms.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "200px",
            border: "1px dashed grey",
            borderRadius: 2,
            p: 3,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No whiteboard rooms yet
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: 2 }}
          >
            Create a new room or join an existing one to start collaborating
          </Typography>
          <Box>
            <Button
              variant="contained"
              onClick={() => setCreateDialogOpen(true)}
              sx={{ mr: 2 }}
            >
              Create Room
            </Button>
            <Button variant="outlined" onClick={() => setJoinDialogOpen(true)}>
              Join Room
            </Button>
          </Box>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {rooms.map((room) => (
            <Grid item key={room._id} xs={12} sm={6} md={4}>
              <RoomCard
                room={room}
                onDelete={() => handleDeleteRoom(room._id)}
                onJoin={() => navigate(`/room/${room.roomId}`)}
                currentUser={currentUser}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Room Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => !creatingRoom && setCreateDialogOpen(false)}
      >
        <DialogTitle>Create New Whiteboard Room</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Room Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            disabled={creatingRoom}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateDialogOpen(false)}
            disabled={creatingRoom}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateRoom}
            variant="contained"
            disabled={!newRoomName.trim() || creatingRoom}
          >
            {creatingRoom ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Room Dialog */}
      <Dialog
        open={joinDialogOpen}
        onClose={() => !joiningRoom && setJoinDialogOpen(false)}
      >
        <DialogTitle>Join Whiteboard Room</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="roomId"
            label="Room ID"
            type="text"
            fullWidth
            variant="outlined"
            value={roomIdToJoin}
            onChange={(e) => setRoomIdToJoin(e.target.value)}
            disabled={joiningRoom}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setJoinDialogOpen(false)}
            disabled={joiningRoom}
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoinRoom}
            variant="contained"
            disabled={!roomIdToJoin.trim() || joiningRoom}
          >
            {joiningRoom ? "Joining..." : "Join"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
