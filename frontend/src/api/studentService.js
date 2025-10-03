import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/students/`;

// create a new student (only teachers allowed)
const createStudent = async (studentData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.post(API_URL + "create", studentData, config);
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to create student" }
    );
  }
};

// link to an existing student (teacher or parent)
const linkStudent = async (studentId, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.put(API_URL + "link", { studentId }, config);
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to link student" }
    );
  }
};

const studentService = {
  createStudent,
  linkStudent,
};

export default studentService;
