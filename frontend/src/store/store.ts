import { configureStore } from "@reduxjs/toolkit";
import playerReducer from "./playerSlice";

export const reduxStore = configureStore({
  reducer: {
    player: playerReducer,
  },
});
