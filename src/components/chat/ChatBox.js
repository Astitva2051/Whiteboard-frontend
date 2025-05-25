import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Avatar,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";

const ChatBox = ({ roomId, messages, onClose }) => {
  const [message, setMessage] = useState("");
  const { currentUser } = useAuth();
  const { sendMessage } = useSocket();
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    sendMessage(roomId, message);
    setMessage("");
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          background: "#fff",
          border: "none",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            backgroundColor: "primary.main",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Chat
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {messages.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 2 }}
            >
              No messages yet. Start the conversation!
            </Typography>
          ) : (
            <List sx={{ p: 0 }}>
              {messages.map((msg, index) => {
                const isCurrentUser = msg.userId === currentUser.id;
                return (
                  <ListItem
                    key={index}
                    sx={{
                      textAlign: isCurrentUser ? "right" : "left",
                      px: 0,
                      py: 0.5,
                      justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                    }}
                    disableGutters
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: isCurrentUser ? "row-reverse" : "row",
                        alignItems: "flex-end",
                        width: "auto",
                        maxWidth: "100%",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: isCurrentUser
                            ? "primary.main"
                            : "secondary.main",
                          fontSize: "0.9rem",
                          mx: 1,
                          boxShadow: 1,
                        }}
                      >
                        {msg.username
                          ? msg.username.charAt(0).toUpperCase()
                          : "?"}
                      </Avatar>

                      <Box
                        sx={{
                          maxWidth: 220,
                          backgroundColor: isCurrentUser
                            ? "#e3f2fd"
                            : "#f1f1f1",
                          borderRadius: 2,
                          p: 1.2,
                          boxShadow: 1,
                          border: isCurrentUser
                            ? "1.5px solid #90caf9"
                            : "1.5px solid #e0e0e0",
                          ml: isCurrentUser ? 0 : 1,
                          mr: isCurrentUser ? 1 : 0,
                          minWidth: 60,
                          wordBreak: "break-word",
                          position: "relative",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontWeight: 600,
                            display: "block",
                            mb: 0.2,
                            textAlign: isCurrentUser ? "right" : "left",
                          }}
                        >
                          {isCurrentUser ? "You" : msg.username}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{ color: "#222", fontSize: "1rem" }}
                        >
                          {msg.message}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "block",
                            mt: 0.5,
                            textAlign: "right",
                            fontSize: "0.7rem",
                          }}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                );
              })}
              <div ref={messagesEndRef} />
            </List>
          )}
        </Box>

        {/* Input */}
        <Box
          component="form"
          onSubmit={handleSendMessage}
          sx={{
            p: 2,
            borderTop: "1px solid #e0e0e0",
            backgroundColor: "#fff",
            flexShrink: 0,
            display: "flex",
            gap: 1,
          }}
        >
          <TextField
            variant="outlined"
            size="small"
            placeholder="Type a message..."
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            autoComplete="off"
          />
          <IconButton type="submit" color="primary" disabled={!message.trim()}>
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatBox;
