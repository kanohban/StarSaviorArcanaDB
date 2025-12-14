import { createSlice } from '@reduxjs/toolkit'

const fullScreenSlice = createSlice({
  name: "fullscreen",
  initialState: {
    value: false
  },
  reducers: {
    active: state => {
      state.value = true
    },
    inactive: state => {
      state.value = false
    },
  }
});

export const { active, inactive } = fullScreenSlice.actions;

export default fullScreenSlice.reducer;