import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, TrendingUp, CheckCircle, Plus, ArrowRight, Activity, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/statistiques/dashboard')
      setStats(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      // En cas d'erreur, initialiser avec des valeurs par défaut
      setStats({
        total_essais: 0,
        essais_recents_7j: 0,
        par_type: {},
        par_statut: {},
        par_mois: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-yellow-800">Aucune donnée disponible pour le moment</p>
        </div>
      </div>
    )
  }

  // Préparer les données pour les graphiques
  const typeData = Object.entries(stats.par_type || {}).map(([type, count]) => ({
    name: type.toUpperCase(),
    value: count || 0,
  }))

  const statutData = Object.entries(stats.par_statut || {}).map(([statut, count]) => ({
    name: statut,
    value: count || 0,
  }))

  // Si pas de données, afficher des graphiques vides plutôt que d'erreur
  const hasTypeData = typeData.length > 0
  const hasStatutData = statutData.length > 0

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
          <p className="text-gray-600">
            Vue d'ensemble complète de vos essais géotechniques
          </p>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total d'essais</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.total_essais || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Tous types confondus</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">7 derniers jours</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.essais_recents_7j || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Essais récents</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Validés</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.par_statut?.valide || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Essais validés</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <Link
          to="/dashboard/essais/nouveau"
          className="bg-gray-900 border border-gray-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
        >
          <div className="p-6 h-full flex flex-col justify-center items-center text-white">
            <div className="bg-white/10 rounded-lg p-3 mb-3 group-hover:bg-white/20 transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-lg font-semibold">Nouvel essai</p>
            <p className="text-sm text-gray-300 mt-1">Créer un essai</p>
          </div>
        </Link>
      </div>

              {/* Graphiques */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Essais par type */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PieChartIcon className="w-6 h-6 text-blue-600" />
              Répartition par type
            </h3>
          </div>
          {hasTypeData ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-gray-400">
              <p>Aucune donnée disponible</p>
            </div>
          )}
        </div>

                {/* Essais par statut */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PieChartIcon className="w-6 h-6 text-green-600" />
              Répartition par statut
            </h3>
          </div>
          {hasStatutData ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={statutData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-gray-400">
              <p>Aucune donnée disponible</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default Dashboard

