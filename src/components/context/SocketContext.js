import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useContext,
} from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [roomUsers, setRoomUsers] = useState([]);
  const { token, isAuthenticated } = useContext(AuthContext);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection when authenticated
    if (isAuthenticated && token) {
      const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

      // Create socket connection with auth token
      const newSocket = io(SOCKET_URL, {
        auth: {
          token,
        },
      });

      // Set socket reference
      socketRef.current = newSocket;
      setSocket(newSocket);

      // Set up event listeners
      newSocket.on("connect", () => {
        console.log("Socket connected");
        setConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setConnected(false);
      });

      newSocket.on("error", (data) => {
        console.error("Socket error:", data.message);
      });

      newSocket.on("room-users", (users) => {
        setRoomUsers(users);
      });

      // Clean up on unmount
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }

    return () => {};
  }, [token, isAuthenticated]);

  // Join a room
  const joinRoom = (roomId) => {
    if (socket && connected) {
      socket.emit("join-room", { roomId });
    }
  };

  // Leave a room
  const leaveRoom = (roomId) => {
    if (socket && connected) {
      socket.emit("leave-room", { roomId });
    }
  };

  // Send drawing events
  const emitDrawStart = (roomId, x, y, color, width) => {
    if (socket && connected) {
      socket.emit("draw-start", { roomId, x, y, color, width });
    }
  };

  const emitDrawMove = (roomId, x, y) => {
    if (socket && connected) {
      socket.emit("draw-move", { roomId, x, y });
    }
  };

  const emitDrawEnd = (roomId) => {
    if (socket && connected) {
      socket.emit("draw-end", { roomId });
    }
  };

  // Add text
  const emitAddText = (roomId, text, x, y, fontSize, color) => {
    if (socket && connected) {
      socket.emit("add-text", { roomId, text, x, y, fontSize, color });
    }
  };

  // Add shape
  const emitAddShape = (roomId, type, x, y, width, height, color) => {
    if (socket && connected) {
      socket.emit("add-shape", { roomId, type, x, y, width, height, color });
    }
  };

  // Clear board
  const emitClearBoard = (roomId) => {
    if (socket && connected) {
      socket.emit("clear-board", { roomId });
    }
  };

  // Send chat message
  const sendMessage = (roomId, message) => {
    if (socket && connected) {
      socket.emit("send-message", { roomId, message });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        roomUsers,
        joinRoom,
        leaveRoom,
        emitDrawStart,
        emitDrawMove,
        emitDrawEnd,
        emitAddText,
        emitAddShape,
        emitClearBoard,
        sendMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
