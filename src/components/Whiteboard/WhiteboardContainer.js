import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Tooltip,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SaveIcon from "@mui/icons-material/Save";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import PeopleIcon from "@mui/icons-material/People";
import ChatIcon from "@mui/icons-material/Chat";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";

import Canvas from "./Canvas";
import WhiteboardToolbar from "./Toolbar";
import ChatBox from "../../components/chat/ChatBox";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import { roomAPI, whiteboardAPI } from "../../api";
import Loading from "../common/Loading";

const WhiteboardContainer = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    socket,
    connected,
    joinRoom: joinRoomRaw,
    leaveRoom: leaveRoomRaw,
    roomUsers,
    onEvent,
  } = useSocket();

  // State for room and whiteboard data
  const [room, setRoom] = useState(null);
  const [whiteboard, setWhiteboard] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [userListOpen, setUserListOpen] = useState(false);

  // Tool state
  const [selectedTool, setSelectedTool] = useState("pen");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedWidth, setSelectedWidth] = useState(3);
  const canvasRef = React.useRef(null);

  // Chat state
  const [messages, setMessages] = useState([]);

  // Alert state
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Fetch room and whiteboard data
  const fetchRoomAndWhiteboard = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await roomAPI.joinRoom(roomId);
      const roomResponse = await roomAPI.getRoom(roomId);
      setRoom(roomResponse.data.data);
      const whiteboardResponse = await whiteboardAPI.getWhiteboard(roomId);
      setWhiteboard(whiteboardResponse.data.data);
    } catch (err) {
      console.error("Error fetching room data:", err);
      setError(err?.response?.data?.message || "Failed to load whiteboard");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Initialize room data
  useEffect(() => {
    fetchRoomAndWhiteboard();
  }, [fetchRoomAndWhiteboard]);

  // Join socket room when connected (fix repeated join/leave)
  useEffect(() => {
    if (!connected || !roomId) return;
    joinRoomRaw(roomId);

    // Clean up - leave room when component unmounts
    return () => {
      leaveRoomRaw(roomId);
    };
    // Only depend on connected and roomId to avoid repeated join/leave
    // DO NOT add joinRoomRaw/leaveRoomRaw to dependencies!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, roomId]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // User connected to room
    const userConnectedCleanup = onEvent("user-connected", (data) => {
      showAlert(`${data.username} joined the room`, "info");
    });

    const ChatHistoryCleanup = onEvent("message-history", (data) => {
      console.log("Chat history received:", data);
      setMessages(data || []);
    });

    // User disconnected from room
    const userDisconnectedCleanup = onEvent("user-disconnected", (data) => {
      showAlert(`${data.username} left the room`, "info");
    });

    // New chat message
    const receiveMessageCleanup = onEvent("receive-message", (data) => {
      console.log("New message received:", data);
      setMessages((prev) => [...prev, data]);

      if (data.userId !== currentUser?._id) {
        showAlert(`New message from ${data.username}`, "info");
      }
    });

    // Clear board event
    const clearBoardCleanup = onEvent("clear-board", (data) => {
      if (data.userId !== currentUser?._id) {
        if (canvasRef?.current?.clearCanvas) {
          canvasRef.current.clearCanvas();
          showAlert(`Whiteboard was cleared by user: ${data.username}`, "info");
        }
      }
    });

    return () => {
      userConnectedCleanup();
      userDisconnectedCleanup();
      receiveMessageCleanup();
      clearBoardCleanup();
      ChatHistoryCleanup();
    };
    // Only depend on socket and currentUser?.id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, currentUser?.id]);

  // Save whiteboard
  const handleSaveWhiteboard = async () => {
    if (!canvasRef?.current) return;
    setSaveLoading(true);
    try {
      const imageData = canvasRef.current.getCanvasImage();
      const elements = canvasRef.current.getElements();
      await whiteboardAPI.saveWhiteboard(roomId, { imageData, elements });
      showAlert("Whiteboard saved successfully", "success");
    } catch (err) {
      console.error("Error saving whiteboard:", err);
      showAlert("Failed to save whiteboard", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  // Clear whiteboard
  const handleClearWhiteboard = () => {
    if (canvasRef?.current?.clearCanvas) {
      canvasRef.current.clearCanvas();
      socket.emit("clear-board", { roomId });
    }
  };

  // Leave room
  const handleLeaveRoom = async () => {
    try {
      // Only call leaveRoom API, not socket leaveRoom, since cleanup will handle socket leave
      await roomAPI.leaveRoom(roomId);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error leaving room:", err);
    }
  };

  // Copy room ID to clipboard
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    showAlert("Room ID copied to clipboard", "success");
  };

  // Download whiteboard as image
  const handleDownloadWhiteboard = () => {
    if (!canvasRef?.current) return;

    const canvas = canvasRef.current.getCanvas(); // Add method to get canvas element

    // Store current canvas content
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempContext = tempCanvas.getContext("2d");

    // Copy current canvas content
    tempContext.fillStyle = "#ffffff"; // Set white background
    tempContext.fillRect(0, 0, canvas.width, canvas.height);
    tempContext.drawImage(canvas, 0, 0);

    // Create download link with white background
    const link = document.createElement("a");
    link.download = `whiteboard-${roomId}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Undo/Redo handlers
  const handleUndo = () => {
    if (canvasRef.current && canvasRef.current.undo) {
      canvasRef.current.undo();
    }
  };
  const handleRedo = () => {
    if (canvasRef.current && canvasRef.current.redo) {
      canvasRef.current.redo();
    }
  };

  // Handler for Canvas stack changes
  const handleStackChange = ({ canUndo, canRedo }) => {
    setCanUndo(canUndo);
    setCanRedo(canRedo);
  };

  // Show alert
  const showAlert = (message, severity = "success") => {
    setAlert({
      open: true,
      message,
      severity,
    });
  };

  // Close alert
  const handleCloseAlert = () => {
    setAlert((prev) => ({ ...prev, open: false }));
  };

  if (loading) {
    return <Loading message="Loading whiteboard..." />;
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          p: 3,
        }}
      >
        <Typography variant="h5" color="error" gutterBottom>
          Error Loading Whiteboard
        </Typography>
        <Typography variant="body1" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/dashboard")}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      {/* Top AppBar */}
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {room?.name || "Whiteboard"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title="Room ID (Click to copy)">
              <Button
                color="inherit"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyRoomId}
                sx={{ mr: 1 }}
              >
                {roomId.substring(0, 8)}...
              </Button>
            </Tooltip>
            <Tooltip title="Users in Room">
              <IconButton
                color="inherit"
                onClick={() => {
                  if (socket && socket.emit) {
                    socket.emit("room-users", { roomId });
                  }
                  setUserListOpen(true);
                }}
                sx={{ mr: 1 }}
              >
                <PeopleIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Chat">
              <IconButton
                color="inherit"
                onClick={() => setChatOpen(!chatOpen)}
                sx={{ mr: 1 }}
              >
                <ChatIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Undo">
              <span>
                <IconButton
                  color="inherit"
                  onClick={handleUndo}
                  disabled={!canUndo}
                >
                  <UndoIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo">
              <span>
                <IconButton
                  color="inherit"
                  onClick={handleRedo}
                  disabled={!canRedo}
                >
                  <RedoIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Save Whiteboard">
              <IconButton
                color="inherit"
                onClick={handleSaveWhiteboard}
                disabled={saveLoading}
                sx={{ mr: 1 }}
              >
                <SaveIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download as Image">
              <IconButton
                color="inherit"
                onClick={handleDownloadWhiteboard}
                sx={{ mr: 1 }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Leave Room">
              <IconButton color="inherit" onClick={handleLeaveRoom}>
                <ExitToAppIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => setDrawerOpen(false)}
        >
          <List>
            <ListItem>
              <Typography variant="h6">{room?.name || "Whiteboard"}</Typography>
            </ListItem>
            <Divider />
            <ListItem button onClick={() => setToolbarOpen(!toolbarOpen)}>
              <ListItemText primary="Toggle Tools" />
            </ListItem>
            <ListItem button onClick={() => setChatOpen(!chatOpen)}>
              <ListItemIcon>
                <ChatIcon />
              </ListItemIcon>
              <ListItemText primary="Chat" />
            </ListItem>
            <ListItem button onClick={() => setUserListOpen(true)}>
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Users" />
            </ListItem>
            <Divider />
            <ListItem button onClick={handleSaveWhiteboard}>
              <ListItemIcon>
                <SaveIcon />
              </ListItemIcon>
              <ListItemText primary="Save Whiteboard" />
            </ListItem>
            <ListItem button onClick={handleClearWhiteboard}>
              <ListItemText primary="Clear Whiteboard" />
            </ListItem>
            <ListItem button onClick={handleDownloadWhiteboard}>
              <ListItemIcon>
                <DownloadIcon />
              </ListItemIcon>
              <ListItemText primary="Download as Image" />
            </ListItem>
            <Divider />
            <ListItem button onClick={handleLeaveRoom}>
              <ListItemIcon>
                <ExitToAppIcon />
              </ListItemIcon>
              <ListItemText primary="Leave Room" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: "100vh",
          pt: "64px", // AppBar height
          display: "flex",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: "100%",
            height: "calc(100vh - 64px)",
          }}
        >
          {/* Toolbar */}
          {toolbarOpen && (
            <Box sx={{ flexShrink: 0 }}>
              <WhiteboardToolbar
                selectedTool={selectedTool}
                setSelectedTool={setSelectedTool}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                selectedWidth={selectedWidth}
                setSelectedWidth={setSelectedWidth}
                onClearCanvas={handleClearWhiteboard}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
                sx={{ flexShrink: 0 }} // Prevent toolbar from shrinking
              />
            </Box>
          )}

          {/* Canvas */}
          <Box
            sx={{
              flex: 1,
              height: "100%",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
            }}
          >
            <Canvas
              ref={canvasRef}
              roomId={roomId}
              tool={selectedTool}
              color={selectedColor}
              width={selectedWidth}
              initialImageData={whiteboard?.imageData}
              initialElements={whiteboard?.elements}
              onStackChange={handleStackChange}
            />
          </Box>

          {/* Chat Panel */}
          {chatOpen && (
            <Box
              sx={{
                width: 320,
                height: "100%",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                borderLeft: "1px solid #e0e0e0",
              }}
            >
              <ChatBox
                roomId={roomId}
                messages={messages}
                onClose={() => setChatOpen(false)}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>

      {/* Users Dialog */}
      <Dialog
        open={userListOpen}
        onClose={() => setUserListOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 340,
            background: "#f8fafc",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            pt: 2,
            background: "linear-gradient(90deg, #1976d2 30%, #42a5f5 90%)",
            color: "white",
            fontWeight: 600,
            fontSize: "1.2rem",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <PeopleIcon /> Users in Room
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <List sx={{ width: "100%" }}>
            {roomUsers.length === 0 ? (
              <ListItem sx={{ justifyContent: "center" }}>
                <Typography color="text.secondary" variant="body2">
                  No users connected
                </Typography>
              </ListItem>
            ) : (
              <>
                {roomUsers.map((user) => (
                  <ListItem
                    key={user.id}
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      bgcolor:
                        user.id === currentUser.id
                          ? "primary.light"
                          : "background.paper",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor:
                          user.id === currentUser.id
                            ? "primary.light"
                            : "action.hover",
                      },
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    }}
                  >
                    <Avatar
                      sx={{
                        mr: 2,
                        bgcolor:
                          user.id === currentUser.id
                            ? "primary.main"
                            : "secondary.main",
                        color: "white",
                        fontWeight: "bold",
                      }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: user.id === currentUser.id ? 600 : 400,
                          color:
                            user.id === currentUser.id
                              ? "primary.dark"
                              : "text.primary",
                        }}
                      >
                        {user.username}
                      </Typography>
                      {user.id === currentUser.id && (
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{ fontWeight: 500 }}
                        >
                          You
                        </Typography>
                      )}
                    </Box>
                  </ListItem>
                ))}
              </>
            )}
          </List>
        </DialogContent>
        <DialogActions
          sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}
        >
          <Button
            onClick={() => setUserListOpen(false)}
            variant="contained"
            sx={{
              px: 4,
              boxShadow: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WhiteboardContainer;
