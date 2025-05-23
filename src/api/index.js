import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API Services
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (userData) => api.post("/auth/login", userData),
  getMe: () => api.get("/auth/me"),
  logout: () => api.get("/auth/logout"),
};

// Room API Services
export const roomAPI = {
  createRoom: (roomData) => api.post("/rooms", roomData),
  getRooms: () => api.get("/rooms"),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
  joinRoom: (roomId) => api.post("/rooms/join", { roomId }),
  leaveRoom: (roomId) => api.delete(`/rooms/${roomId}/leave`),
  deleteRoom: (roomId) => api.delete(`/rooms/${roomId}`),
};

// Whiteboard API Services
export const whiteboardAPI = {
  getWhiteboard: (roomId) => api.get(`/whiteboards/${roomId}`),
  saveWhiteboard: (roomId, whiteboardData) =>
    api.put(`/whiteboards/${roomId}`, whiteboardData),
  clearWhiteboard: (roomId) => api.delete(`/whiteboards/${roomId}/clear`),
};

export default api;
