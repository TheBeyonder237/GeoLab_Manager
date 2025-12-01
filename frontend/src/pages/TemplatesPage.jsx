import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileCheck, Plus, Trash2, Edit, Copy, Eye, ArrowLeft, Users, Globe } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

function TemplatesPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, atterberg, cbr, proctor, granulometrie

  useEffect(() => {
    fetchTemplates()
  }, [filter])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const params = filter !== 'all' ? `?type_essai=${filter}` : ''
      const response = await api.get(`/templates/${params}`)
      setTemplates(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error)
      toast.error('Erreur lors du chargement des templates')
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = async (templateId) => {
    try {
      const response = await api.post(`/templates/${templateId}/use`)
      // Rediriger vers la création d'essai avec les données du template
      navigate('/dashboard/essais/nouveau', { state: { templateData: response.data } })
      toast.success('Template appliqué avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'utilisation du template:', error)
      toast.error('Erreur lors de l\'utilisation du template')
    }
  }

  const handleDelete = async (templateId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      return
    }

    try {
      await api.delete(`/templates/${templateId}`)
      toast.success('Template supprimé avec succès')
      fetchTemplates()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const getTypeLabel = (type) => {
    const labels = {
      atterberg: "Limites d'Atterberg",
      cbr: "CBR",
      proctor: "Proctor",
      granulometrie: "Granulométrie",
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Chargement des templates...</p>
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
                <FileCheck className="w-8 h-8" />
                Modèles d'essais
              </h1>
              <p className="text-gray-600 mt-1">Templates réutilisables pour créer des essais rapidement</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/essais/nouveau')}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau template
          </button>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filtrer par type :</span>
          {['all', 'atterberg', 'cbr', 'proctor', 'granulometrie'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === type
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {type === 'all' ? 'Tous' : getTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des templates */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600 mb-2">Aucun template disponible</p>
          <p className="text-sm text-gray-500 mb-6">Créez votre premier template pour accélérer la création d'essais</p>
          <button
            onClick={() => navigate('/dashboard/essais/nouveau')}
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Créer un template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{template.nom}</h3>
                      {template.est_public ? (
                        <Globe className="w-4 h-4 text-blue-600" title="Template public" />
                      ) : (
                        <Users className="w-4 h-4 text-gray-400" title="Template privé" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{getTypeLabel(template.type_essai)}</p>
                    {template.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{template.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <span>Créé par:</span>
                    <span className="font-medium">{template.createur_nom}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Copy className="w-3 h-3" />
                    <span>{template.usage_count} utilisations</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleUseTemplate(template.id)}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Utiliser
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TemplatesPage

