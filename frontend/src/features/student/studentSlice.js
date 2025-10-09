import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import studentService from "../../api/studentService";
import { updateUser } from "../auth/authSlice";

// Async Thunks

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
        error.response?.data?.message ||
          error.message ||
          "Student login failed"
      );
    }
  }
);

// Get all students linked to user
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

// Create student (teacher only)
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

// Link existing student to parent
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
      return data; // { message, user, student }
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
  token: null,
  isLoading: false,
  isLinking: false,
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
      state.isLinking = false;
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
        state.isLinking = true;
      })
      .addCase(linkStudent.fulfilled, (state, action) => {
        state.isLinking = false;
        const newStudent = action.payload.student;

        if (newStudent) {
          const exists = state.myStudents.some((s) => s._id === newStudent._id);
          if (!exists) {
            state.myStudents.push(newStudent);
          }
        }
      })
      .addCase(linkStudent.rejected, (state, action) => {
        state.isLinking = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});


export const { reset } = studentSlice.actions;
export default studentSlice.reducer;
