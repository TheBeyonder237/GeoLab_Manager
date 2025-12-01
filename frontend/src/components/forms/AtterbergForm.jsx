import { useState, useEffect } from 'react'
import { Plus, Trash2, Calculator, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import AtterbergGraph from '../graphs/AtterbergGraph'

function AtterbergForm({ essaiId, initialData, onSave }) {
  const [formData, setFormData] = useState({
    // Limite de liquidité (WL)
    wl_nombre_coups_1: '',
    wl_teneur_eau_1: '',
    wl_nombre_coups_2: '',
    wl_teneur_eau_2: '',
    wl_nombre_coups_3: '',
    wl_teneur_eau_3: '',
    wl_methode: 'casagrande',
    
    // Limite de plasticité (WP)
    wp_teneur_eau_1: '',
    wp_teneur_eau_2: '',
    wp_teneur_eau_3: '',
    
    // Limite de retrait (WR) - Optionnel
    wr_teneur_eau: '',
    volume_initial: '',
    volume_final: '',
    masse_seche: '',
    
    // Conditions
    temperature: '',
    humidite_relative: '',
  })

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
      if (initialData.wl || initialData.wp || initialData.ip) {
        setResults({
          wl: initialData.wl,
          wp: initialData.wp,
          wr: initialData.wr,
          ip: initialData.ip,
          ic: initialData.ic,
          ir: initialData.ir,
          classification: initialData.classification
        })
      }
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : (name.includes('nombre_coups') || name.includes('temperature') || name.includes('humidite') || name.includes('volume') || name.includes('masse') ? parseFloat(value) || '' : parseFloat(value) || '')
    }))
  }

  const calculateResults = async () => {
    if (!essaiId) {
      toast.error('Veuillez d\'abord créer l\'essai')
      return
    }

    setLoading(true)
    try {
      // Préparer les données
      const data = {
        essai_id: essaiId,
        ...Object.fromEntries(
          Object.entries(formData).map(([key, value]) => [
            key,
            value === '' ? null : (typeof value === 'string' && !isNaN(value) ? parseFloat(value) : value)
          ])
        )
      }

      // Si l'essai existe déjà, mettre à jour, sinon créer
      let response
      if (initialData?.id) {
        response = await api.put(`/essais/atterberg/${initialData.id}`, data)
      } else {
        response = await api.post('/essais/atterberg/', data)
      }

      setResults({
        wl: response.data.wl,
        wp: response.data.wp,
        wr: response.data.wr,
        ip: response.data.ip,
        ic: response.data.ic,
        ir: response.data.ir,
        classification: response.data.classification
      })

      toast.success('Calculs effectués avec succès !')
      if (onSave) onSave(response.data)
    } catch (error) {
      console.error('Erreur lors du calcul:', error)
      toast.error(error.response?.data?.detail || 'Erreur lors du calcul')
    } finally {
      setLoading(false)
    }
  }

  const hasWLData = formData.wl_nombre_coups_1 || formData.wl_nombre_coups_2 || formData.wl_nombre_coups_3
  const hasWPData = formData.wp_teneur_eau_1 || formData.wp_teneur_eau_2 || formData.wp_teneur_eau_3

  return (
    <div className="space-y-6">
      {/* Limite de Liquidité (WL) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Limite de Liquidité (WL) - NF P94-051
          </h3>
          {hasWLData && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Données saisies
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Essai 1 - Nombre de coups</label>
            <input
              type="number"
              name="wl_nombre_coups_1"
              value={formData.wl_nombre_coups_1}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="25"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Essai 1 - Teneur en eau (%)</label>
            <input
              type="number"
              step="0.01"
              name="wl_teneur_eau_1"
              value={formData.wl_teneur_eau_1}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="45.2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Essai 2 - Nombre de coups</label>
            <input
              type="number"
              name="wl_nombre_coups_2"
              value={formData.wl_nombre_coups_2}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Essai 2 - Teneur en eau (%)</label>
            <input
              type="number"
              step="0.01"
              name="wl_teneur_eau_2"
              value={formData.wl_teneur_eau_2}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Essai 3 - Nombre de coups</label>
            <input
              type="number"
              name="wl_nombre_coups_3"
              value={formData.wl_nombre_coups_3}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Essai 3 - Teneur en eau (%)</label>
            <input
              type="number"
              step="0.01"
              name="wl_teneur_eau_3"
              value={formData.wl_teneur_eau_3}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Méthode</label>
          <select
            name="wl_methode"
            value={formData.wl_methode}
            onChange={handleChange}
            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="casagrande">Coupelle de Casagrande</option>
            <option value="cone">Cône de pénétration</option>
          </select>
        </div>
      </div>

      {/* Limite de Plasticité (WP) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Limite de Plasticité (WP)
          </h3>
          {hasWPData && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Données saisies
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Essai 1 - Teneur en eau (%)</label>
            <input
              type="number"
              step="0.01"
              name="wp_teneur_eau_1"
              value={formData.wp_teneur_eau_1}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Essai 2 - Teneur en eau (%)</label>
            <input
              type="number"
              step="0.01"
              name="wp_teneur_eau_2"
              value={formData.wp_teneur_eau_2}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Essai 3 - Teneur en eau (%)</label>
            <input
              type="number"
              step="0.01"
              name="wp_teneur_eau_3"
              value={formData.wp_teneur_eau_3}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Limite de Retrait (WR) - Optionnel */}
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Limite de Retrait (WR) - Optionnel
          </h3>
          <span className="text-xs text-gray-500">Optionnel</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Teneur en eau (%)</label>
            <input
              type="number"
              step="0.01"
              name="wr_teneur_eau"
              value={formData.wr_teneur_eau}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Volume initial (cm³)</label>
            <input
              type="number"
              step="0.01"
              name="volume_initial"
              value={formData.volume_initial}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Volume final (cm³)</label>
            <input
              type="number"
              step="0.01"
              name="volume_final"
              value={formData.volume_final}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Masse sèche (g)</label>
            <input
              type="number"
              step="0.01"
              name="masse_seche"
              value={formData.masse_seche}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Conditions de l'essai</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Température (°C)</label>
            <input
              type="number"
              step="0.1"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="20"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Humidité relative (%)</label>
            <input
              type="number"
              step="0.1"
              name="humidite_relative"
              value={formData.humidite_relative}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="50"
            />
          </div>
        </div>
      </div>

      {/* Graphique */}
      {formData && (hasWLData || initialData) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <AtterbergGraph data={formData} />
        </div>
      )}

      {/* Résultats */}
      {results && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-lg p-6 border-2 border-blue-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            Résultats Calculés
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {results.wl && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">WL</div>
                <div className="text-2xl font-bold text-blue-600">{results.wl}%</div>
                <div className="text-xs text-gray-600">Limite de liquidité</div>
              </div>
            )}
            {results.wp && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">WP</div>
                <div className="text-2xl font-bold text-green-600">{results.wp}%</div>
                <div className="text-xs text-gray-600">Limite de plasticité</div>
              </div>
            )}
            {results.ip !== undefined && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">IP</div>
                <div className="text-2xl font-bold text-purple-600">{results.ip}%</div>
                <div className="text-xs text-gray-600">Indice de plasticité</div>
              </div>
            )}
            {results.wr && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">WR</div>
                <div className="text-2xl font-bold text-orange-600">{results.wr}%</div>
                <div className="text-xs text-gray-600">Limite de retrait</div>
              </div>
            )}
          </div>
          {results.classification && (
            <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm font-medium text-gray-700 mb-1">Classification</div>
              <div className="text-lg font-semibold text-gray-800">{results.classification}</div>
            </div>
          )}
        </div>
      )}

      {/* Bouton de calcul */}
      <div className="flex justify-end">
        <button
          onClick={calculateResults}
          disabled={loading || !essaiId || (!hasWLData && !hasWPData)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          <Calculator className="w-5 h-5" />
          {loading ? 'Calcul en cours...' : 'Calculer les résultats'}
        </button>
      </div>
    </div>
  )
}

export default AtterbergForm

