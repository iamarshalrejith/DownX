import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import studentService from "../../api/studentService";
import { updateUser } from "../auth/authSlice";

// Async thunks

export const getStudents = createAsyncThunk(
  "students/getAll",
  async(_,thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await studentService.getStudents(token);
    } catch (error) {
        return thunkAPI.rejectWithValue(
          error.response?.message || error.message || "Failed to fetch students"
        )
    }
  }
)

// Create student (Teacher only)
export const createStudent = createAsyncThunk(
  "students/create",
  async (studentData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token; // get token from auth slice
      return await studentService.createStudent(studentData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.message || error.message || "Failed to create student"
      );
    }
  }
);

// Link student (Teacher or Parent)
export const linkStudent = createAsyncThunk(
  "students/link",
  async ({ studentId }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token; // get token from auth slice
      const data = await studentService.linkStudent(studentId, token);

      // after linking, backend returns updated user -> update auth slice
      thunkAPI.dispatch(updateUser(data.updatedUser));
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.message || error.message || "Failed to link student"
      );
    }
  }
);

// Slice
const initialState = {
  myStudents: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

const studentSlice = createSlice({
  name: "students",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Students
      .addCase(getStudents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStudents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.myStudents = action.payload; 
      })
      .addCase(getStudents.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Create student
      .addCase(createStudent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createStudent.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(createStudent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Link student
      .addCase(linkStudent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(linkStudent.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(linkStudent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = studentSlice.actions;
export default studentSlice.reducer;
