import { createSlice } from '@reduxjs/toolkit'

const modeSlice = createSlice({
  name: "mode",
  initialState: {
    value: localStorage.getItem("viewMode") || "pc"
  },
  reducers: {
    toggle: state => {
      state.value = state.value === "pc" ? "mobile" : "pc";
      localStorage.setItem("viewMode", state.value);
    },
  }
});

export const { toggle } = modeSlice.actions;

export default modeSlice.reducer;