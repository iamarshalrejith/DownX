import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/students/`;

// Get all students
const getStudents = async (token) => {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };
    const response = await axios.get(API_URL, config);
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to fetch students" }
    );
  }
};

// Create a new student (teacher) with optional visualPin
const createStudent = async (studentData, token) => {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };
    const response = await axios.post(API_URL + "create", studentData, config);
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to create student" }
    );
  }
};

// Link to an existing student (parent) with optional visualPin
const linkStudent = async (studentData, token) => {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };
    const response = await axios.put(API_URL + "link", studentData, config);
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to link student" }
    );
  }
};

// Student login with visualPin
const loginStudent = async ({ enrollmentId, visualPin }) => {
  try {
    const response = await axios.post(`${API_URL}login`, {
      enrollmentId,
      visualPin, // send array of strings
    });
    return response.data; // returns student info + token
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Student login failed" }
    );
  }
};


// Reset student visual PIN
const resetStudentPin = async (studentId, visualPin, token) => {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    const response = await axios.patch(
      `${API_URL}${studentId}/reset-pin`,
      { visualPin },
      config
    );

    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to reset PIN" }
    );
  }
};

// Enable / disable face authentication
const toggleFaceAuth = async (studentId, enabled, token) => {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    const response = await axios.patch(
      `${API_URL}${studentId}/face-auth`,
      { enabled },
      config
    );

    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to update face auth" }
    );
  }
};

// Activate / deactivate student account
const toggleStudentActive = async (studentId, active, token) => {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    const response = await axios.patch(
      `${API_URL}${studentId}/active`,
      { active },
      config
    );

    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to update student status" }
    );
  }
};


const studentService = {
  getStudents,
  createStudent,
  linkStudent,
  loginStudent,
  resetStudentPin,
  toggleFaceAuth,
  toggleStudentActive,
};

export default studentService;

