import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

// task api url
const API_URL = `${BASE_URL}/api/tasks/`;

// ai simplification api url
const AI_URL = `${BASE_URL}/api/ai/simplify`;

// simplify Instruction
const simplifyInstruction = async (inputText, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.post(AI_URL, { inputText }, config);
    return response.data;
  } catch (error) {
    console.error("Simplify API Error:", error);
    return Promise.reject(
      error.response?.data || { message: "Failed to simplify instructions" }
    );
  }
};

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
    console.error("Create task error:", error);
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
    console.error("Get Tasks Error:", error);
    return Promise.reject(
      error.response?.data || { message: "Failed to fetch tasks" }
    );
  }
};

// get task by id
const getTaskById = async (id, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.get(`${API_URL}${id}`, config);
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to fetch task details" }
    );
  }
};

const markTaskComplete = async (id, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.put(`${API_URL}complete/${id}`, {}, config);
    return response.data;
  } catch (error) {
    console.error("Mark Task Complete Error:", error);
    return Promise.reject(
      error.response?.data || { message: "Failed to mark task complete" }
    );
  }
};

const unmarkTaskComplete = async (id, token) => {
  try {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.put(`${API_URL}uncomplete/${id}`, {}, config);
    return response.data;
  } catch (error) {
    console.error("Unmark Task Complete Error:", error);
    return Promise.reject(
      error.response?.data || { message: "Failed to revert task completion" }
    );
  }
};

const taskService = {
  simplifyInstruction,
  createTask,
  getTasks,
  getTaskById,
  markTaskComplete,
  unmarkTaskComplete,
};

export default taskService;

