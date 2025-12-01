import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

const initialState = {
  essais: [],
  currentEssai: null,
  loading: false,
  error: null,
}

// Async thunks
export const fetchEssais = createAsyncThunk(
  'essais/fetchEssais',
  async ({ skip = 0, limit = 100, type_essai, statut, search, operateur_id, projet_id, date_debut, date_fin } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ skip, limit })
      if (type_essai) params.append('type_essai', type_essai)
      if (statut) params.append('statut', statut)
      if (search) params.append('search', search)
      if (operateur_id) params.append('operateur_id', operateur_id)
      if (projet_id) params.append('projet_id', projet_id)
      if (date_debut) params.append('date_debut', date_debut)
      if (date_fin) params.append('date_fin', date_fin)
      
      const response = await api.get(`/essais/?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Erreur')
    }
  }
)

export const fetchEssai = createAsyncThunk(
  'essais/fetchEssai',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/essais/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Erreur')
    }
  }
)

export const createEssai = createAsyncThunk(
  'essais/createEssai',
  async (essaiData, { rejectWithValue }) => {
    try {
      const response = await api.post('/essais/', essaiData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Erreur')
    }
  }
)

export const updateEssai = createAsyncThunk(
  'essais/updateEssai',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/essais/${id}`, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Erreur')
    }
  }
)

export const deleteEssai = createAsyncThunk(
  'essais/deleteEssai',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/essais/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Erreur')
    }
  }
)

const essaisSlice = createSlice({
  name: 'essais',
  initialState,
  reducers: {
    clearCurrentEssai: (state) => {
      state.currentEssai = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch essais
      .addCase(fetchEssais.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEssais.fulfilled, (state, action) => {
        state.loading = false
        state.essais = action.payload
      })
      .addCase(fetchEssais.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch essai
      .addCase(fetchEssai.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEssai.fulfilled, (state, action) => {
        state.loading = false
        state.currentEssai = action.payload
      })
      .addCase(fetchEssai.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create essai
      .addCase(createEssai.fulfilled, (state, action) => {
        state.essais.unshift(action.payload)
      })
      // Update essai
      .addCase(updateEssai.fulfilled, (state, action) => {
        const index = state.essais.findIndex(e => e.id === action.payload.id)
        if (index !== -1) {
          state.essais[index] = action.payload
        }
        if (state.currentEssai?.id === action.payload.id) {
          state.currentEssai = action.payload
        }
      })
      // Delete essai
      .addCase(deleteEssai.fulfilled, (state, action) => {
        state.essais = state.essais.filter(e => e.id !== action.payload)
      })
  },
})

export const { clearCurrentEssai, clearError } = essaisSlice.actions
export default essaisSlice.reducer

