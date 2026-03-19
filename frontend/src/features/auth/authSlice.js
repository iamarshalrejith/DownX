import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../../api/authService";

// Load user from localStorage on startup
let storedUser = null;
try {
  const raw = localStorage.getItem("user");
  if (raw) storedUser = JSON.parse(raw);
} catch {
  storedUser = null;
}

const initialState = {
  user: storedUser || null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

// Register
export const register = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Registration failed",
      );
    }
  },
);

// Login
export const login = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      return await authService.login(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Login failed",
      );
    }
  },
);

// Logout
export const logout = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("user");
});

//  Update Profile
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async ({ name, email }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      const data = await authService.updateProfile({ name, email }, token);
      return data.user; // backend returns { message, user: {..., token} }
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Profile update failed",
      );
    }
  },
);

// Change Password
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ currentPassword, newPassword }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      const data = await authService.changePassword(
        { currentPassword, newPassword },
        token,
      );
      return data.message;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Password change failed",
      );
    }
  },
);

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    // Used internally to sync user object (e.g. after studentSlice updates)
    updateUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (s) => {
        s.isLoading = true;
      })
      .addCase(register.fulfilled, (s, a) => {
        s.isLoading = false;
        s.isSuccess = true;
        s.user = a.payload;
      })
      .addCase(register.rejected, (s, a) => {
        s.isLoading = false;
        s.isError = true;
        s.message = a.payload;
        s.user = null;
      })

      // Login
      .addCase(login.pending, (s) => {
        s.isLoading = true;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.isLoading = false;
        s.isSuccess = true;
        s.user = a.payload;
        localStorage.setItem("user", JSON.stringify(a.payload));
      })
      .addCase(login.rejected, (s, a) => {
        s.isLoading = false;
        s.isError = true;
        s.message = a.payload;
        s.user = null;
      })

      // Logout
      .addCase(logout.fulfilled, (s) => {
        s.user = null;
      })

      // Update Profile
      .addCase(updateProfile.pending, (s) => {
        s.isLoading = true;
        s.isError = false;
        s.message = "";
      })
      .addCase(updateProfile.fulfilled, (s, a) => {
        s.isLoading = false;
        s.isSuccess = true;
        s.user = { ...s.user, ...a.payload }; // merge fresh data + new token
        localStorage.setItem("user", JSON.stringify(s.user));
      })
      .addCase(updateProfile.rejected, (s, a) => {
        s.isLoading = false;
        s.isError = true;
        s.message = a.payload;
      })

      // Change Password
      .addCase(changePassword.pending, (s) => {
        s.isLoading = true;
        s.isError = false;
        s.message = "";
      })
      .addCase(changePassword.fulfilled, (s, a) => {
        s.isLoading = false;
        s.isSuccess = true;
        s.message = a.payload;
      })
      .addCase(changePassword.rejected, (s, a) => {
        s.isLoading = false;
        s.isError = true;
        s.message = a.payload;
      });
  },
});

export const { reset, updateUser } = authSlice.actions;
export default authSlice.reducer;
