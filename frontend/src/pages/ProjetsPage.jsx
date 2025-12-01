import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FolderOpen, Plus, Edit, Trash2, Archive, Search, Filter, FileText, Calendar, User, Building, MapPin, X } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

function ProjetsPage() {
  const navigate = useNavigate()
  const [projets, setProjets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    statut: '',
    search: '',
    archive: false
  })

  useEffect(() => {
    fetchProjets()
  }, [filters])

  const fetchProjets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.statut) params.append('statut', filters.statut)
      if (filters.search) params.append('search', filters.search)
      if (filters.archive !== null) params.append('archive', filters.archive)
      
      const response = await api.get(`/projets/?${params}`)
      setProjets(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error)
      toast.error('Erreur lors du chargement des projets')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (projetId, projetNom) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${projetNom}" ?`)) {
      return
    }

    try {
      await api.delete(`/projets/${projetId}`)
      toast.success('Projet supprimé avec succès')
      fetchProjets()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression')
    }
  }

  const handleArchive = async (projetId) => {
    try {
      await api.post(`/projets/${projetId}/archive`)
      toast.success('Projet archivé avec succès')
      fetchProjets()
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error)
      toast.error('Erreur lors de l\'archivage')
    }
  }

  const getStatutBadge = (statut, estArchive) => {
    if (estArchive) {
      return "bg-gray-100 text-gray-800 border-gray-300"
    }
    const badges = {
      actif: "bg-green-100 text-green-800 border-green-300",
      termine: "bg-blue-100 text-blue-800 border-blue-300",
      archive: "bg-gray-100 text-gray-800 border-gray-300",
    }
    return badges[statut] || "bg-gray-100 text-gray-800 border-gray-300"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Chargement des projets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <FolderOpen className="w-8 h-8" />
                Projets géotechniques
              </h1>
              <p className="text-gray-600">
                Gérez vos projets et leurs essais associés
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/projets/nouveau')}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nouveau projet
            </button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              value={filters.statut}
              onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
            >
              <option value="">Tous</option>
              <option value="actif">Actif</option>
              <option value="termine">Terminé</option>
              <option value="archive">Archivé</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ statut: '', search: '', archive: false })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste des projets */}
      {projets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600 mb-2">Aucun projet trouvé</p>
          <p className="text-sm text-gray-500 mb-6">Créez votre premier projet pour commencer</p>
          <button
            onClick={() => navigate('/dashboard/projets/nouveau')}
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Créer un projet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projets.map((projet) => (
            <div
              key={projet.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatutBadge(projet.statut, projet.est_archive)}`}>
                        {projet.est_archive ? 'Archivé' : projet.statut}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{projet.nom}</h3>
                    <p className="text-sm text-gray-600 font-mono">{projet.code_projet}</p>
                  </div>
                </div>

                {projet.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{projet.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  {projet.client && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{projet.client}</span>
                    </div>
                  )}
                  {projet.site && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{projet.site}</span>
                    </div>
                  )}
                  {projet.responsable_nom && (
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{projet.responsable_nom}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{projet.nombre_essais} essai(s)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <Link
                    to={`/dashboard/projets/${projet.id}`}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-center text-sm"
                  >
                    Voir
                  </Link>
                  <Link
                    to={`/dashboard/projets/${projet.id}/modifier`}
                    className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  {!projet.est_archive && (
                    <button
                      onClick={() => handleArchive(projet.id)}
                      className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
                      title="Archiver"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(projet.id, projet.nom)}
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

export default ProjetsPage

