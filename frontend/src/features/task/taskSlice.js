import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import taskService from "../../api/taskService.js";

// Mark complete 
export const markTaskComplete = createAsyncThunk(
  "task/markTaskComplete",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await taskService.markTaskComplete(id, token);
      return { id, message: response.message };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to complete task"
      );
    }
  }
);

// Unmark complete 
export const unmarkTaskComplete = createAsyncThunk(
  "task/unmarkTaskComplete",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await taskService.unmarkTaskComplete(id, token);
      return { id, message: response.message };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to revert task"
      );
    }
  }
);

// Create simplified task (AI + DB) 
export const createSimplifiedTask = createAsyncThunk(
  "task/createSimplifiedTask",
  async ({ taskData, token }, { rejectWithValue }) => {
    try {
      const aiResponse = await taskService.simplifyInstruction(
        taskData.originalInstructions,
        token
      );

      if (!aiResponse?.steps || !Array.isArray(aiResponse.steps)) {
        throw new Error("AI did not return valid simplified steps");
      }

      const finalTaskData = { ...taskData, simplifiedSteps: aiResponse.steps };
      return await taskService.createTask(finalTaskData, token);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to create task"
      );
    }
  }
);

// Get all tasks 
export const getAllTasks = createAsyncThunk(
  "task/getAllTasks",
  async (token, { rejectWithValue }) => {
    try {
      return await taskService.getTasks(token);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch tasks"
      );
    }
  }
);

// Day 38: Verify objects
export const verifyObjectForTask = createAsyncThunk(
  "task/verifyObjectForTask",
  async ({ taskId, enrollmentId, detectedObjects, confidenceScores }, { rejectWithValue }) => {
    try {
      const result = await taskService.verifyObjectForTask(
        taskId,
        enrollmentId,
        detectedObjects,
        confidenceScores
      );
      return { taskId, ...result };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Verification failed"
      );
    }
  }
);

//  Slice 
const taskSlice = createSlice({
  name: "task",
  initialState: {
    tasks:        [],
    currentTask:  null,
    loading:      false,
    success:      false,
    error:        null,
    // Tracks which tasks have been object-verified this session
    verifiedTasks: {},
  },
  reducers: {
    resetTaskState: (state) => {
      state.loading     = false;
      state.success     = false;
      state.error       = null;
      state.currentTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create
      .addCase(createSimplifiedTask.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(createSimplifiedTask.fulfilled, (s, a) => { s.loading = false; s.success = true; s.currentTask = a.payload; s.tasks.unshift(a.payload); })
      .addCase(createSimplifiedTask.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      // Get all
      .addCase(getAllTasks.pending,   (s) => { s.loading = true; })
      .addCase(getAllTasks.fulfilled, (s, a) => { s.loading = false; s.tasks = a.payload; })
      .addCase(getAllTasks.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      // Mark complete
      .addCase(markTaskComplete.pending,   (s) => { s.loading = true; })
      .addCase(markTaskComplete.fulfilled, (s, a) => {
        s.loading = false; s.success = true;
        const t = s.tasks.find((t) => t._id === a.payload.id);
        if (t) { t.isCompleted = true; t.isCompletedByMe = true; }
      })
      .addCase(markTaskComplete.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      // Unmark complete
      .addCase(unmarkTaskComplete.pending,   (s) => { s.loading = true; })
      .addCase(unmarkTaskComplete.fulfilled, (s, a) => {
        s.loading = false; s.success = true;
        const t = s.tasks.find((t) => t._id === a.payload.id);
        if (t) { t.isCompleted = false; t.isCompletedByMe = false; }
      })
      .addCase(unmarkTaskComplete.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      // Verify objects
      .addCase(verifyObjectForTask.fulfilled, (s, a) => {
        if (a.payload.verified) {
          s.verifiedTasks[a.payload.taskId] = true;
        }
      })
      .addCase(verifyObjectForTask.rejected, (s, a) => {
        console.error("Object verification failed:", a.payload);
      });
  },
});

export const { resetTaskState } = taskSlice.actions;
export default taskSlice.reducer;