import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

function ProjetForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [users, setUsers] = useState([])

  const [formData, setFormData] = useState({
    nom: '',
    code_projet: '',
    description: '',
    client: '',
    site: '',
    responsable_id: '',
    date_debut: '',
    date_fin: '',
    statut: 'actif'
  })

  useEffect(() => {
    if (isEdit && id) {
      fetchProjet()
    }
    fetchUsers()
  }, [id, isEdit])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/')
      setUsers(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    }
  }

  const fetchProjet = async () => {
    try {
      const response = await api.get(`/projets/${id}`)
      const projet = response.data
      setFormData({
        nom: projet.nom || '',
        code_projet: projet.code_projet || '',
        description: projet.description || '',
        client: projet.client || '',
        site: projet.site || '',
        responsable_id: projet.responsable_id || '',
        date_debut: projet.date_debut ? projet.date_debut.split('T')[0] : '',
        date_fin: projet.date_fin ? projet.date_fin.split('T')[0] : '',
        statut: projet.statut || 'actif'
      })
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error)
      toast.error('Erreur lors du chargement du projet')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const submitData = {
        ...formData,
        responsable_id: formData.responsable_id ? parseInt(formData.responsable_id) : null,
        date_debut: formData.date_debut ? new Date(formData.date_debut).toISOString() : null,
        date_fin: formData.date_fin ? new Date(formData.date_fin).toISOString() : null
      }

      if (isEdit) {
        await api.put(`/projets/${id}`, submitData)
        toast.success('Projet modifié avec succès')
      } else {
        await api.post('/projets/', submitData)
        toast.success('Projet créé avec succès')
      }
      navigate('/projets')
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Une erreur est survenue'
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage))
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projets')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isEdit ? 'Modifier le projet' : 'Nouveau projet'}
            </h1>
            <p className="text-gray-600">
              {isEdit ? 'Modifiez les informations du projet' : 'Créez un nouveau projet géotechnique'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du projet *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code projet *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono"
                value={formData.code_projet}
                onChange={(e) => setFormData({ ...formData, code_projet: e.target.value.toUpperCase() })}
                placeholder="PROJ-2024-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site / Localisation
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                value={formData.site}
                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsable du projet
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                value={formData.responsable_id}
                onChange={(e) => setFormData({ ...formData, responsable_id: e.target.value })}
              >
                <option value="">Aucun responsable</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.username} {user.role ? `(${user.role})` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Sélectionnez la personne responsable de ce projet
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              >
                <option value="actif">Actif</option>
                <option value="termine">Terminé</option>
                <option value="archive">Archivé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                value={formData.date_debut}
                onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                value={formData.date_fin}
                onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du projet..."
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/projets')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ProjetForm

