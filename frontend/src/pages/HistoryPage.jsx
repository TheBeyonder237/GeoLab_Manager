import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, Clock, User, FileText, ArrowLeft, RefreshCw } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'

function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, create, update, status_change

  useEffect(() => {
    fetchHistory()
  }, [filter])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await api.get('/history/recent?limit=100')
      let data = response.data

      // Filtrer par type d'action
      if (filter !== 'all') {
        data = data.filter(item => item.action === filter)
      }

      setHistory(data)
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error)
      toast.error('Erreur lors du chargement de l\'historique')
    } finally {
      setLoading(false)
    }
  }

  const getActionLabel = (action) => {
    const labels = {
      create: 'Création',
      update: 'Modification',
      status_change: 'Changement de statut',
      delete: 'Suppression'
    }
    return labels[action] || action
  }

  const getActionColor = (action) => {
    const colors = {
      create: 'bg-green-100 text-green-800 border-green-200',
      update: 'bg-blue-100 text-blue-800 border-blue-200',
      status_change: 'bg-purple-100 text-purple-800 border-purple-200',
      delete: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[action] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Chargement de l'historique...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <History className="w-8 h-8" />
                Historique des modifications
              </h1>
              <p className="text-gray-600 mt-1">Suivi complet de toutes les actions sur les essais</p>
            </div>
          </div>
          <button
            onClick={fetchHistory}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filtrer par :</span>
          {['all', 'create', 'update', 'status_change'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {f === 'all' ? 'Tous' : getActionLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {history.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun historique disponible</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {history.map((item, index) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      item.action === 'create' ? 'bg-green-500' :
                      item.action === 'update' ? 'bg-blue-500' :
                      item.action === 'status_change' ? 'bg-purple-500' :
                      'bg-red-500'
                    }`}></div>
                    {index < history.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActionColor(item.action)}`}>
                          {getActionLabel(item.action)}
                        </span>
                        {item.field_name && (
                          <span className="text-sm text-gray-600">
                            Champ: <span className="font-medium">{item.field_name}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {format(new Date(item.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{item.user_name}</span>
                      <span className="text-gray-400">•</span>
                      <Link
                        to={`/essais/${item.essai_id}`}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                      >
                        <FileText className="w-4 h-4" />
                        Essai #{item.essai_id}
                      </Link>
                    </div>

                    {/* Changements */}
                    {item.changes && Object.keys(item.changes).length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 mt-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Modifications :</p>
                        <div className="space-y-2">
                          {Object.entries(item.changes).map(([field, values]) => (
                            <div key={field} className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-gray-700">{field}:</span>
                              <span className="text-red-600 line-through">{values.old || 'N/A'}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-green-600 font-medium">{values.new || 'N/A'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Valeurs simples */}
                    {item.old_value && item.new_value && !item.changes && (
                      <div className="bg-gray-50 rounded-lg p-4 mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-red-600 line-through">{item.old_value}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-600 font-medium">{item.new_value}</span>
                        </div>
                      </div>
                    )}

                    {/* Commentaire */}
                    {item.comment && (
                      <p className="text-sm text-gray-600 mt-2 italic">{item.comment}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryPage

