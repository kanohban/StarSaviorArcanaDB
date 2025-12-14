import { createSlice } from '@reduxjs/toolkit'

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    value: localStorage.getItem("theme") || "dark"
  },
  reducers: {
    toggle: state => {
      state.value = state.value === "dark" ? "light" : "dark";
      localStorage.setItem("theme", state.value);
    },
  }
});

export const { toggle } = themeSlice.actions;

export default themeSlice.reducer;