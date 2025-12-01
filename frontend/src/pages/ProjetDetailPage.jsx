import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Archive, Plus, FileText, Calendar, User, Building, MapPin, FolderOpen } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

function ProjetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [projet, setProjet] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchProjet()
    }
  }, [id])

  const fetchProjet = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/projets/${id}?include_essais=true`)
      setProjet(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error)
      toast.error('Erreur lors du chargement du projet')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${projet.nom}" ?`)) {
      return
    }

    try {
      await api.delete(`/projets/${id}`)
      toast.success('Projet supprimé avec succès')
      navigate('/projets')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression')
    }
  }

  const handleArchive = async () => {
    try {
      await api.post(`/projets/${id}/archive`)
      toast.success('Projet archivé avec succès')
      fetchProjet()
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error)
      toast.error('Erreur lors de l\'archivage')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Chargement du projet...</p>
        </div>
      </div>
    )
  }

  if (!projet) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Projet non trouvé</p>
        <Link to="/projets" className="text-gray-900 hover:underline mt-4 inline-block">
          Retour à la liste
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard/projets"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{projet.nom}</h1>
              <p className="text-sm text-gray-600 font-mono">{projet.code_projet}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!projet.est_archive && (
              <button
                onClick={handleArchive}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all shadow-sm hover:shadow-md"
              >
                <Archive className="w-5 h-5" />
                Archiver
              </button>
            )}
            <Link
              to={`/dashboard/projets/${id}/modifier`}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
            >
              <Edit className="w-5 h-5" />
              Modifier
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-all shadow-sm hover:shadow-md"
            >
              <Trash2 className="w-5 h-5" />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Informations Générales</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">Nom du projet</dt>
                <dd className="mt-1 text-base text-gray-900">{projet.nom}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">Code projet</dt>
                <dd className="mt-1 text-base text-gray-900 font-mono">{projet.code_projet}</dd>
              </div>
              {projet.client && (
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-gray-500">Client</dt>
                  <dd className="mt-1 text-base text-gray-900">{projet.client}</dd>
                </div>
              )}
              {projet.site && (
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-gray-500">Site</dt>
                  <dd className="mt-1 text-base text-gray-900">{projet.site}</dd>
                </div>
              )}
              {projet.responsable_nom && (
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-gray-500">Responsable</dt>
                  <dd className="mt-1 text-base text-gray-900">{projet.responsable_nom}</dd>
                </div>
              )}
              {projet.date_debut && (
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-gray-500">Date de début</dt>
                  <dd className="mt-1 text-base text-gray-900">
                    {format(new Date(projet.date_debut), 'dd MMMM yyyy', { locale: fr })}
                  </dd>
                </div>
              )}
              {projet.date_fin && (
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-gray-500">Date de fin</dt>
                  <dd className="mt-1 text-base text-gray-900">
                    {format(new Date(projet.date_fin), 'dd MMMM yyyy', { locale: fr })}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {projet.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Description</h2>
              <p className="text-base text-gray-700 whitespace-pre-wrap">{projet.description}</p>
            </div>
          )}

          {/* Liste des essais */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2 flex-1">
                Essais ({projet.essais?.length || 0})
              </h2>
              <Link
                to={`/dashboard/essais/nouveau?projet_id=${id}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Ajouter un essai
              </Link>
            </div>
            {projet.essais && projet.essais.length > 0 ? (
              <div className="space-y-3">
                {projet.essais.map((essai) => (
                  <Link
                    key={essai.id}
                    to={`/essais/${essai.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{essai.numero_essai}</h3>
                        <p className="text-sm text-gray-600">{essai.type_essai}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          essai.statut === 'valide' ? 'bg-green-100 text-green-800' :
                          essai.statut === 'termine' ? 'bg-blue-100 text-blue-800' :
                          essai.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {essai.statut}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Aucun essai dans ce projet</p>
                <Link
                  to={`/dashboard/essais/nouveau?projet_id=${id}`}
                  className="mt-4 inline-flex items-center gap-2 text-gray-900 hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Créer le premier essai
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Nombre d'essais</p>
                <p className="text-2xl font-bold text-gray-900">{projet.nombre_essais}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Statut</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{projet.est_archive ? 'Archivé' : projet.statut}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métadonnées</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Créé le</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(projet.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
              {projet.updated_at && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Modifié le</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(projet.updated_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
              )}
              {projet.created_by_nom && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Créé par</p>
                  <p className="text-sm font-medium text-gray-900">{projet.created_by_nom}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjetDetailPage

