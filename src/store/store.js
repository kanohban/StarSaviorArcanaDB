import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './reducers/toggle/themeToggle';
import modeReducer from './reducers/toggle/modeToggle';
import saviorsReducer from './reducers/list/saviorList';
import fullScreenReducer from './reducers/toggle/fullScreenArcpintToggle';

export default configureStore({
  reducer: {
    theme: themeReducer,
    mode: modeReducer,

    saviors: saviorsReducer,
    fullscreen: fullScreenReducer
  }
})