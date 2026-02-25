import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk: Fetch help requests
export const fetchHelpRequests = createAsyncThunk(
  'gesture/fetchHelpRequests',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/gestures/help-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.helpRequests;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch help requests');
    }
  }
);

// Async thunk: Log gesture
export const logGesture = createAsyncThunk(
  'gesture/logGesture',
  async (gestureData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/gestures/log', gestureData);
      return response.data.gestureEvent;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to log gesture');
    }
  }
);

// Async thunk: Resolve gesture
export const resolveGesture = createAsyncThunk(
  'gesture/resolveGesture',
  async ({ gestureId, responseNote }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/api/gestures/${gestureId}/resolve`,
        { responseNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.gesture;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resolve gesture');
    }
  }
);

const gestureSlice = createSlice({
  name: 'gesture',
  initialState: {
    helpRequests: [],
    recentGestures: [],
    isLoading: false,
    error: null,
    lastGestureLogged: null
  },
  reducers: {
    clearGestureError: (state) => {
      state.error = null;
    },
    addRecentGesture: (state, action) => {
      state.recentGestures.unshift(action.payload);
      if (state.recentGestures.length > 10) {
        state.recentGestures = state.recentGestures.slice(0, 10);
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch Help Requests
    builder
      .addCase(fetchHelpRequests.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHelpRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.helpRequests = action.payload;
      })
      .addCase(fetchHelpRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Log Gesture
    builder
      .addCase(logGesture.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logGesture.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastGestureLogged = action.payload;
        state.recentGestures.unshift(action.payload);
        if (state.recentGestures.length > 10) {
          state.recentGestures = state.recentGestures.slice(0, 10);
        }
      })
      .addCase(logGesture.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Resolve Gesture
    builder
      .addCase(resolveGesture.fulfilled, (state, action) => {
        // Remove from help requests
        state.helpRequests = state.helpRequests.filter(
          req => req._id !== action.payload._id
        );
      })
      .addCase(resolveGesture.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { clearGestureError, addRecentGesture } = gestureSlice.actions;
export default gestureSlice.reducer;