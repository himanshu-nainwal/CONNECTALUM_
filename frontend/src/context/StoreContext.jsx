import { createContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import config from "../config";
import toast from "react-hot-toast";

export const StoreContext = createContext(null);

const StoreContextProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [userLoading, setUserLoading] = useState(false);

  const axiosAuth = useCallback(() => {
    return axios.create({
      baseURL: config.API_URL,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }, [token]);

  const fetchUser = useCallback(async (tkn) => {
    if (!tkn) return;
    try {
      setUserLoading(true);
      const res = await axios.get(`${config.API_URL}/user/me`, {
        headers: { Authorization: `Bearer ${tkn}` }
      });
      if (res.data.success) setUser(res.data.user);
    } catch {
      // token expired
      logout();
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchUser(token);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${config.API_URL}/user/login`, { email, password });
      if (res.data.success) {
        const { token: tkn, role: r, user: u } = res.data;
        localStorage.setItem("token", tkn);
        localStorage.setItem("role", r);
        setToken(tkn);
        setRole(r);
        setUser(u);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Login failed" };
    }
  };

  const register = async (name, email, password, userRole) => {
    try {
      const res = await axios.post(`${config.API_URL}/user/register`, { name, email, password, role: userRole });
      if (res.data.success) {
        const { token: tkn, role: r, user: u } = res.data;
        localStorage.setItem("token", tkn);
        localStorage.setItem("role", r);
        setToken(tkn);
        setRole(r);
        setUser(u);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Registration failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken("");
    setRole("");
    setUser(null);
  };

  return (
    <StoreContext.Provider value={{
      showLogin, setShowLogin, token, role, user, setUser,
      userLoading, login, register, logout, axiosAuth,
      url: config.API_URL
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
