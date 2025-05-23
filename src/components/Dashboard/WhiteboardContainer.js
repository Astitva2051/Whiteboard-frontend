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
  const { socket, connected, joinRoom, leaveRoom, roomUsers, onEvent } =
    useSocket();

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

  // Initialize room data
  useEffect(() => {
    fetchRoomAndWhiteboard();
  }, [roomId]);

  // Join socket room when connected
  useEffect(() => {
    if (connected && roomId) {
      joinRoom(roomId);

      // Clean up - leave room when component unmounts
      return () => {
        leaveRoom(roomId);
      };
    }
  }, [connected, roomId]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // User connected to room
    const userConnectedCleanup = onEvent("user-connected", (data) => {
      showAlert(`${data.username} joined the room`, "info");
    });

    // User disconnected from room
    const userDisconnectedCleanup = onEvent("user-disconnected", (data) => {
      showAlert(`${data.username} left the room`, "info");
    });

    // New chat message
    const receiveMessageCleanup = onEvent("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
      if (data.userId !== currentUser?.id) {
        showAlert(`New message from ${data.username}`, "info");
      }
    });

    // Clear board event
    const clearBoardCleanup = onEvent("clear-board", (data) => {
      if (data.userId !== currentUser?.id) {
        if (canvasRef?.current?.clearCanvas) {
          canvasRef.current.clearCanvas();
          showAlert("Whiteboard was cleared by another user", "info");
        }
      }
    });

    return () => {
      userConnectedCleanup();
      userDisconnectedCleanup();
      receiveMessageCleanup();
      clearBoardCleanup();
    };
    // Only depend on socket and currentUser?.id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, currentUser?.id]);

  // Fetch room and whiteboard data
  const fetchRoomAndWhiteboard = async () => {
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
  };

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
      leaveRoom(roomId);
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
    const dataUrl = canvasRef.current.getCanvasImage();
    const link = document.createElement("a");
    link.download = `whiteboard-${roomId}.png`;
    link.href = dataUrl;
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
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
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
                onClick={() => setUserListOpen(true)}
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
          display: "flex",
          flexDirection: "column",
          height: "100%",
          pt: "64px", // AppBar height
        }}
      >
        <Box sx={{ display: "flex", height: "100%" }}>
          {/* Toolbar */}
          {toolbarOpen && (
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
            />
          )}

          {/* Canvas */}
          <Box sx={{ flexGrow: 1, height: "100%", overflow: "hidden" }}>
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
                height: "calc(100vh - 64px)", // Fix: fit below AppBar
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                zIndex: 10,
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
            borderRadius: 4,
            minWidth: 340,
            background: "#f8fafc",
            boxShadow: 10,
            p: 0,
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 0,
            fontWeight: 700,
            fontSize: "1.3rem",
            textAlign: "center",
            letterSpacing: 0.5,
            background: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          Users in Room
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 2,
            pb: 1,
            px: 0,
            background: "#f8fafc",
            minHeight: 120,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <List sx={{ width: "100%", px: 0 }}>
            {roomUsers.length === 0 && (
              <ListItem sx={{ justifyContent: "center" }}>
                <Typography color="text.secondary" variant="body2">
                  No users connected
                </Typography>
              </ListItem>
            )}
            {roomUsers.map((user, idx) => (
              <React.Fragment key={user.id}>
                <ListItem
                  sx={{
                    mb: 0,
                    py: 1.2,
                    px: 3,
                    borderRadius: 2,
                    bgcolor: user.id === currentUser.id ? "#e3f2fd" : "#fff",
                    boxShadow: user.id === currentUser.id ? 2 : 0,
                    alignItems: "center",
                    display: "flex",
                    gap: 2,
                    transition: "background 0.2s",
                  }}
                  disableGutters
                >
                  <Avatar
                    sx={{
                      bgcolor:
                        user.id === currentUser.id
                          ? "primary.main"
                          : "grey.400",
                      width: 40,
                      height: 40,
                      fontWeight: 700,
                      fontSize: "1.15rem",
                      mr: 2,
                      boxShadow: user.id === currentUser.id ? 2 : 0,
                    }}
                  >
                    {user.username
                      ? user.username.charAt(0).toUpperCase()
                      : "?"}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: user.id === currentUser.id ? 700 : 500,
                        color:
                          user.id === currentUser.id
                            ? "primary.main"
                            : "text.primary",
                        fontSize: "1.08rem",
                        display: "flex",
                        alignItems: "center",
                        letterSpacing: 0.1,
                      }}
                    >
                      {user.username}
                      {user.id === currentUser.id && (
                        <Typography
                          variant="caption"
                          sx={{
                            ml: 1,
                            color: "primary.main",
                            fontWeight: 400,
                            fontSize: "0.98em",
                          }}
                        >
                          (You)
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </ListItem>
                {idx < roomUsers.length - 1 && (
                  <Divider sx={{ mx: 3, my: 0 }} />
                )}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions
          sx={{
            pb: 2,
            pt: 1,
            justifyContent: "center",
            background: "#f8fafc",
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        >
          <Button
            onClick={() => setUserListOpen(false)}
            variant="outlined"
            sx={{
              minWidth: 100,
              fontWeight: 600,
              letterSpacing: 0.5,
              borderRadius: 2,
              boxShadow: 0,
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
