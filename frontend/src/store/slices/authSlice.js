import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// Récupérer le token depuis localStorage
const getStoredToken = () => {
  try {
    return localStorage.getItem('token')
  } catch (error) {
    return null
  }
}

const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  } catch (error) {
    return null
  }
}

const initialState = {
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  loading: false,
  error: null,
}

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      // OAuth2PasswordRequestForm attend application/x-www-form-urlencoded
      const params = new URLSearchParams()
      params.append('username', username)
      params.append('password', password)
      
      const response = await api.post('/auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      
      const { access_token } = response.data
      
      if (!access_token) {
        return rejectWithValue('Token non reçu du serveur')
      }
      
      // Stocker le token immédiatement
      localStorage.setItem('token', access_token)
      
      // Configurer l'Authorization header pour les prochaines requêtes
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      // Récupérer les infos utilisateur avec le token explicitement dans les headers
      const userResponse = await api.get('/auth/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      })
      
      // Stocker l'utilisateur
      localStorage.setItem('user', JSON.stringify(userResponse.data))
      
      return { token: access_token, user: userResponse.data }
    } catch (error) {
      console.error('Erreur de connexion:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Erreur de connexion'
      return rejectWithValue(errorMessage)
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Erreur lors de l'inscription"
      )
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me')
      localStorage.setItem('user', JSON.stringify(response.data))
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Erreur')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.token = action.payload.token
        state.user = action.payload.user
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Get current user
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload
      })
  },
})

export const { logout, clearError } = authSlice.actions
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectUser = (state) => state.auth.user
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error

export default authSlice.reducer

