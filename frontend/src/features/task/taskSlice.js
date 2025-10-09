import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import taskService from "../../api/taskService.js";


// Thunk: Create Simplified Task (AI + DB Orchestration)
export const createSimplifiedTask = createAsyncThunk(
  "task/createSimplifiedTask",
  async ({ taskData, token }, { rejectWithValue }) => {
    try {
      // Step 1: Call AI Simplification Endpoint
      const aiResponse = await taskService.simplifyInstruction(taskData.originalInstructions, token);

      if (!aiResponse?.steps || !Array.isArray(aiResponse.steps)) {
        throw new Error("AI did not return valid simplified steps");
      }

      // Step 2: Merge AI steps into taskData
      const finalTaskData = {
        ...taskData,
        simplifiedSteps: aiResponse.steps,
      };

      // Step 3: Save Final Task to Database
      const savedTask = await taskService.createTask(finalTaskData, token);

      return savedTask;
    } catch (error) {
      console.error("Error in createSimplifiedTask:", error);
      return rejectWithValue(error.message || "Failed to create simplified task");
    }
  }
);

// Thunk: Get All Tasks
export const getAllTasks = createAsyncThunk(
  "task/getAllTasks",
  async (token, { rejectWithValue }) => {
    try {
      return await taskService.getTasks(token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch tasks");
    }
  }
);

// Initial State
  
const initialState = {
  tasks: [],
  currentTask: null,
  loading: false,
  success: false,
  error: null,
};

// Slice
const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    resetTaskState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.currentTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* --- Create Simplified Task --- */
      .addCase(createSimplifiedTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSimplifiedTask.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentTask = action.payload;
        state.tasks.unshift(action.payload);
      })
      .addCase(createSimplifiedTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* --- Get All Tasks --- */
      .addCase(getAllTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(getAllTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetTaskState } = taskSlice.actions;
export default taskSlice.reducer;
