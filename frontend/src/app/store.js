import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice.js";
import studentReducer from "../features/student/studentSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    students: studentReducer,
  },
});
