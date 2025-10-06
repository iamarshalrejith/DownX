import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import studentService from "../../api/studentService";
import { updateUser } from "../auth/authSlice";

// Async thunks
// Student login
export const studentLogin = createAsyncThunk(
  "students/login",
  async ({ enrollmentId, visualPin }, thunkAPI) => {
    try {
      const data = await studentService.loginStudent({
        enrollmentId,
        visualPin,
      });

      // Update auth slice with student + token
      thunkAPI.dispatch(updateUser({ ...data.student, token: data.token }));

      return data; // { student, token }
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Student login failed"
      );
    }
  }
);

export const getStudents = createAsyncThunk(
  "students/getAll",
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await studentService.getStudents(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.message || error.message || "Failed to fetch students"
      );
    }
  }
);

export const createStudent = createAsyncThunk(
  "students/create",
  async (studentData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await studentService.createStudent(studentData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.message || error.message || "Failed to create student"
      );
    }
  }
);

export const linkStudent = createAsyncThunk(
  "students/link",
  async ({ enrollmentId, visualPin }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const data = await studentService.linkStudent(
        { enrollmentId, visualPin },
        token
      );
      thunkAPI.dispatch(updateUser(data.user));
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
  student: null,
  isLoading: false,
  loginSuccess: false,
  isError: false,
  message: "",
};

const studentSlice = createSlice({
  name: "students",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.loginSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Student login
      .addCase(studentLogin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(studentLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loginSuccess = true;
        state.student = action.payload.student;
        state.token = action.payload.token;
      })
      .addCase(studentLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Get Students
      .addCase(getStudents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStudents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myStudents = action.payload;
      })
      .addCase(getStudents.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Create Student
      .addCase(createStudent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createStudent.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createStudent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Link Student
      .addCase(linkStudent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(linkStudent.fulfilled, (state) => {
        state.isLoading = false;
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
