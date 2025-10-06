import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import taskService from "../../api/taskService.js";

// thunk => createSimplifiedTask
export const createSimplifiedTask = createAsyncThunk(
  "task/createSimplifiedTask",
  async ({ taskData, token }, { rejectWithValue }) => {
    try {
      return await taskService.createTask(taskData, token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create task");
    }
  }
);

// thunk => getalltasks
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

const initialState = {
  tasks: [],
  currentTask: null,
  loading: false,
  success: false,
  error: null,
};

// Slice
const taskSlice = createSlice({
  name: "tasks",
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
      // create task
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

      // get all tasks
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
