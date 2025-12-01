import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import EssaisList from './pages/EssaisList'
import EssaiForm from './pages/EssaiForm'
import EssaiDetail from './pages/EssaiDetail'
import UsersList from './pages/UsersList'
import Statistics from './pages/Statistics'
import HistoryPage from './pages/HistoryPage'
import ComparisonPage from './pages/ComparisonPage'
import TemplatesPage from './pages/TemplatesPage'
import ProjetsPage from './pages/ProjetsPage'
import ProjetDetailPage from './pages/ProjetDetailPage'
import ProjetForm from './pages/ProjetForm'
import SettingsPage from './pages/SettingsPage'
import QualityControles from './pages/QualityControles'
import QualityCalibrations from './pages/QualityCalibrations'
import QualityNonConformites from './pages/QualityNonConformites'
import { selectIsAuthenticated } from './store/slices/authSlice'
import { wsService } from './services/websocket'

function PrivateRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  const isAuthenticated = useSelector(selectIsAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      wsService.connect()
    } else {
      wsService.disconnect()
    }
    return () => wsService.disconnect()
  }, [isAuthenticated])

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projets" element={<ProjetsPage />} />
        <Route path="projets/nouveau" element={<ProjetForm />} />
        <Route path="projets/:id" element={<ProjetDetailPage />} />
        <Route path="projets/:id/modifier" element={<ProjetForm />} />
        <Route path="essais" element={<EssaisList />} />
        <Route path="essais/nouveau" element={<EssaiForm />} />
        <Route path="essais/:id" element={<EssaiDetail />} />
        <Route path="essais/:id/modifier" element={<EssaiForm />} />
        <Route path="qualite/controles" element={<QualityControles />} />
        <Route path="qualite/calibrations" element={<QualityCalibrations />} />
        <Route path="qualite/non-conformites" element={<QualityNonConformites />} />
        <Route path="comparaison" element={<ComparisonPage />} />
        <Route path="historique" element={<HistoryPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="utilisateurs" element={<UsersList />} />
        <Route path="statistiques" element={<Statistics />} />
        <Route path="parametres" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App
