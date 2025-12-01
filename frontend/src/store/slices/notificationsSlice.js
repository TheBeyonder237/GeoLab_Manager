import { createSlice } from '@reduxjs/toolkit';

const initialState = [];

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.push({
        id: Date.now(),
        read: false,
        ...action.payload,
        timestamp: new Date().toISOString()
      });
    },
    markAsRead: (state, action) => {
      const notification = state.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllAsRead: (state) => {
      state.forEach(notification => {
        notification.read = true;
      });
    },
    removeNotification: (state, action) => {
      return state.filter(n => n.id !== action.payload);
    },
    clearNotifications: () => {
      return initialState;
    }
  }
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearNotifications
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
