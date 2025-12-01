import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: false,
  darkMode: localStorage.getItem('theme') === 'dark',
  searchOpen: false,
  currentModal: null,
  modalProps: null,
  loading: false,
  error: null
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('theme', state.darkMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', state.darkMode);
    },
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen;
    },
    showModal: (state, action) => {
      state.currentModal = action.payload.modalType;
      state.modalProps = action.payload.modalProps;
    },
    hideModal: (state) => {
      state.currentModal = null;
      state.modalProps = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
  toggleSidebar,
  toggleDarkMode,
  toggleSearch,
  showModal,
  hideModal,
  setLoading,
  setError,
  clearError
} = uiSlice.actions;

export default uiSlice.reducer;
