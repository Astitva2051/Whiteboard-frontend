import { useContext, useEffect, useCallback } from "react";
import { SocketContext } from "../context/SocketContext";

// Custom hook to access socket context and set up event listeners
const useSocket = () => {
  const context = useContext(SocketContext);

  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  const { socket } = context;

  // Helper to set up event listeners
  const onEvent = useCallback(
    (event, callback) => {
      if (socket) {
        socket.on(event, callback);

        // Clean up listener when component unmounts or socket changes
        return () => {
          socket.off(event, callback);
        };
      }
      return () => {};
    },
    [socket]
  );

  return {
    ...context,
    onEvent,
  };
};

export default useSocket;
