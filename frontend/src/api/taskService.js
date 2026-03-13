import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;
const API_URL  = `${BASE_URL}/api/tasks/`;
const AI_URL   = `${BASE_URL}/api/ai/simplify`;

//  AI Simplification 
const simplifyInstruction = async (inputText, token) => {
  try {
    const response = await axios.post(
      AI_URL,
      { inputText },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to simplify instructions" }
    );
  }
};

//  Create task 
const createTask = async (taskData, token) => {
  try {
    const response = await axios.post(API_URL, taskData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to create task" }
    );
  }
};

//  Get all tasks 
const getTasks = async (token) => {
  try {
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to fetch tasks" }
    );
  }
};

//  Get task by id
const getTaskById = async (id, token) => {
  try {
    const response = await axios.get(`${API_URL}${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to fetch task" }
    );
  }
};

// Mark complete 
const markTaskComplete = async (id, token) => {
  try {
    const response = await axios.put(`${API_URL}complete/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to mark task complete" }
    );
  }
};

// Unmark complete
const unmarkTaskComplete = async (id, token) => {
  try {
    const response = await axios.put(`${API_URL}uncomplete/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to revert task" }
    );
  }
};

// Verify objects for a task 
/**
 * @param {string}   taskId
 * @param {string}   enrollmentId
 * @param {string[]} detectedObjects   - labels detected by TF model
 * @param {Object}   confidenceScores  - { label: score }
 */
const verifyObjectForTask = async (taskId, enrollmentId, detectedObjects, confidenceScores = {}) => {
  try {
    const response = await axios.post(`${API_URL}${taskId}/verify-object`, {
      enrollmentId,
      detectedObjects,
      confidenceScores,
    });
    return response.data;
  } catch (error) {
    return Promise.reject(
      error.response?.data || { message: "Failed to verify objects" }
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
  verifyObjectForTask,
};

export default taskService;