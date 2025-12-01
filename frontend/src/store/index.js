import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import notificationsReducer from './slices/notificationsSlice';
import uiReducer from './slices/uiSlice';
import essaisReducer from './slices/essaisSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
    ui: uiReducer,
    essais: essaisReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorer certaines actions non-sérialisables
        ignoredActions: ['notifications/addNotification'],
        ignoredPaths: ['notifications.items']
      }
    })
});
