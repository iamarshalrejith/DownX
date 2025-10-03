import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../../api/authService";

// step 1 -> load user from local storage -> if already logged in
const storedUser = JSON.parse(localStorage.getItem("user"));

const initialState = {
  user: storedUser ? storedUser : null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

//--------------------------

// step 2 -> define thunks
// register user
export const register = createAsyncThunk(
  "auth/register", // action name
  async (userData, thunkAPI) => {
    try {
      return await authService.register(userData); // talk to backend
    } catch (error) {
      const msg = error.message || "Registration failed";
      return thunkAPI.rejectWithValue(msg); // returns error message if it fails
    }
  }
);

// login user
export const login = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      return await authService.login(userData);
    } catch (error) {
      const msg = error.message || "Login failed";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// logout user
export const logout = createAsyncThunk("auth/logout", async () => {
  authService.logout();
});

// ------------------------------

// step 3 -> create auth slice

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    reset: (state) => {
      // contains reset flags and messages -> for clearing errors b/w attempts
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    updateUser: (state,action) => {
      state.user = action.payload;
      localStorage.setItem("user",JSON.stringify(action.payload));
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload; // payload -> user data + token
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload; // error msg
        state.user = null;
      }) // register cases

      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      }) // login cases

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

// exporting action
export const { reset,updateUser } = authSlice.actions;

// export reducer
export default authSlice.reducer;
