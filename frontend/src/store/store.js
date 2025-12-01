import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import essaisSlice from './slices/essaisSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    essais: essaisSlice,
  },
})

