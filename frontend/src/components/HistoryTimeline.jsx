import { useEffect, useState } from 'react'
import { Clock, User, History } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

function HistoryTimeline({ essaiId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (essaiId) {
      fetchHistory()
    }
  }, [essaiId])

  const fetchHistory = async () => {
    try {
      const response = await api.get(`/essais/${essaiId}/history`)
      setHistory(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error)
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
      create: 'bg-green-500',
      update: 'bg-blue-500',
      status_change: 'bg-purple-500',
      delete: 'bg-red-500'
    }
    return colors[action] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">Aucun historique disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          {/* Timeline dot */}
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${getActionColor(item.action)}`}></div>
            {index < history.length - 1 && (
              <div className="w-0.5 h-full bg-gray-200 mt-2 min-h-[40px]"></div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900">
                {getActionLabel(item.action)}
              </span>
              {item.field_name && (
                <span className="text-xs text-gray-500">• {item.field_name}</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {item.user_name}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(item.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
              </div>
            </div>
            {item.changes && Object.keys(item.changes).length > 0 && (
              <div className="bg-gray-50 rounded p-2 text-xs">
                {Object.entries(item.changes).map(([field, values]) => (
                  <div key={field} className="flex items-center gap-2">
                    <span className="font-medium">{field}:</span>
                    <span className="text-red-600 line-through">{values.old || 'N/A'}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-600 font-medium">{values.new || 'N/A'}</span>
                  </div>
                ))}
              </div>
            )}
            {item.old_value && item.new_value && !item.changes && (
              <div className="bg-gray-50 rounded p-2 text-xs flex items-center gap-2">
                <span className="text-red-600 line-through">{item.old_value}</span>
                <span className="text-gray-400">→</span>
                <span className="text-green-600 font-medium">{item.new_value}</span>
              </div>
            )}
            {item.comment && (
              <p className="text-xs text-gray-600 mt-1 italic">{item.comment}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default HistoryTimeline

