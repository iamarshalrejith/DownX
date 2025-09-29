import { createSlice } from "@reduxjs/toolkit";

const storedUser = JSON.parse(localStorage.getItem("user"));

const initialState = {
    user: storedUser ? storedUser : null,
    isLoading: false,
    isError: false,
}

const authSlice = createSlice({
    name: "auth",
    initialState: initialState,
    reducers:{
        // Action -> logs user in
        login: (state, action) => {
            state.user = action.payload; // payload => {id,name,role,token}
            localStorage.setItem("user", JSON.stringify(action.payload))
        },

        // Action -> logs user out
        logout: (state) => {
            state.user = null;
            localStorage.removeItem("user")
        },
    },
});

// exporting actions
export const { login, logout} = authSlice.actions;

// export reducer
export default authSlice.reducer;