// messenger layer -> send and recieve data b/w frontend and backend
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/auth/`;

const register = async (userData) => {
  try {
    const response = await axios.post(API_URL + "register", userData);
    if (response.data) {
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    // Return a consistent object with message
    return Promise.reject(
      error.response?.data || { message: "Registration failed" }
    );
  }
};

const login = async (userData) => {
  try {
    const response = await axios.post(API_URL + "login", userData);
    if (response.data) {
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    return Promise.reject(error.response?.data || { message: "Login failed" });
  }
};

const logout = () => {
  localStorage.removeItem("user");
};

const authService = {
  register,
  login,
  logout,
};

export default authService;
