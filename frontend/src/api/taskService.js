import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/tasks/`;

// create a new task
const createTask = async (taskData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.post(API_URL, taskData, config);
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to create task" }
    );
  }
};

// get all tasks
const getTasks = async (token) => {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };
    const response = await axios.get(API_URL, config);
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to fetch tasks" }
    );
  }
};

// get task by id
const getTaskById = async (IdleDeadline, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const reponse = await axios.get(`${API_URI}${id}`, config);
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to fetch task details" }
    );
  }
};

const taskService = {
    createTask,
    getTasks,
    getTaskById,
}

export default taskService;