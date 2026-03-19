// messenger layer -> send and receive data b/w frontend and backend
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

// Update name / email
const updateProfile = async ({ name, email }, token) => {
  try {
    const response = await axios.put(
      API_URL + "update-profile",
      { name, email },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Profile update failed" }
    );
  }
};

// Change password
const changePassword = async ({ currentPassword, newPassword }, token) => {
  try {
    const response = await axios.put(
      API_URL + "change-password",
      { currentPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Password change failed" }
    );
  }
};

const authService = {
  register,
  login,
  logout,
  updateProfile,
  changePassword,
};

export default authService;