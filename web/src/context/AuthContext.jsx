import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSetup, setIsSetup] = useState(null);

  useEffect(() => {
    checkSetupAndAuth();
  }, []);

  const checkSetupAndAuth = async () => {
    try {
      const setupRes = await api.get("/auth/setup-status");
      setIsSetup(setupRes.data.isSetup);

      if (setupRes.data.isSetup) {
        try {
          const meRes = await api.get("/auth/me");
          setUser(meRes.data.user);
        } catch {
          setUser(null);
          localStorage.removeItem("token");
        }
      }
    } catch (err) {
      console.error("Setup check failed", err);
      setIsSetup(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
    }
    setUser(res.data.user);
    return res.data;
  };

  const registerAdmin = async (data) => {
    const res = await api.post("/auth/register-admin", data);
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
    }
    setUser(res.data.user);
    setIsSetup(true);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSetup,
        login,
        registerAdmin,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
