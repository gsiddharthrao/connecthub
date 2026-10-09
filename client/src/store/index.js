import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import postsReducer from './slices/postsSlice';
import connectionsReducer from './slices/connectionsSlice';
import profileReducer from './slices/profileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    connections: connectionsReducer,
    profile: profileReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
