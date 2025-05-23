import React, { createContext, useState, useEffect } from "react";
import { authAPI } from "../../api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load user data if token exists
    const loadUser = async () => {
      setLoading(true);

      if (token) {
        try {
          const res = await authAPI.getMe();
          setCurrentUser(res.data.data);
          setError(null);
        } catch (err) {
          // Token might be expired or invalid
          localStorage.removeItem("token");
          setToken(null);
          setCurrentUser(null);
          setError("Authentication failed. Please log in again.");
        }
      }

      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (userData) => {
    setLoading(true);

    try {
      const res = await authAPI.register(userData);

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      setError(null);

      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (userData) => {
    setLoading(true);

    try {
      const res = await authAPI.login(userData);

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      setError(null);

      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        loading,
        error,
        register,
        login,
        logout,
        isAuthenticated: !!token && !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
