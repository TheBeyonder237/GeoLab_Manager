import { useState, useEffect } from 'react'
import { Plus, Trash2, Calculator, TrendingUp, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import ProctorGraph from '../graphs/ProctorGraph'

function ProctorForm({ essaiId, initialData, onSave }) {
  const [formData, setFormData] = useState({
    type_proctor: 'normal',
    diametre_moule: '',
    hauteur_moule: '',
    volume_moule: '',
    energie_compactage: '',
    nombre_couches: '',
    nombre_coups: '',
    masse_mouton: '',
    hauteur_chute: '',
    masse_moule_vide: '',
  })

  const [points, setPoints] = useState([
    { teneur_eau: '', masse_humide: '', masse_seche: '', volume: '', densite_humide: '', densite_seche: '' }
  ])

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
      if (initialData.points_mesure) {
        setPoints(initialData.points_mesure)
      }
      if (initialData.opm || initialData.densite_seche_max) {
        setResults({
          opm: initialData.opm,
          densite_seche_max: initialData.densite_seche_max,
          densite_humide_max: initialData.densite_humide_max,
          saturation_optimale: initialData.saturation_optimale,
          courbe_proctor: initialData.courbe_proctor
        })
      }
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : parseFloat(value) || ''
    }))
  }

  const handlePointChange = (index, field, value) => {
    const newPoints = [...points]
    newPoints[index] = {
      ...newPoints[index],
      [field]: value === '' ? '' : parseFloat(value) || ''
    }

    // Calcul automatique de la densité sèche si possible
    const point = newPoints[index]
    if (point.teneur_eau && point.densite_humide) {
      point.densite_seche = (point.densite_humide / (1 + point.teneur_eau / 100)).toFixed(3)
    } else if (point.masse_seche && point.volume && point.volume > 0) {
      point.densite_seche = (point.masse_seche / point.volume).toFixed(3)
    } else if (point.masse_humide && point.teneur_eau && point.volume && point.volume > 0) {
      const masse_seche_calc = point.masse_humide / (1 + point.teneur_eau / 100)
      point.densite_seche = (masse_seche_calc / point.volume).toFixed(3)
    }

    // Calcul de la densité humide si possible
    if (point.masse_humide && point.volume && point.volume > 0) {
      point.densite_humide = (point.masse_humide / point.volume).toFixed(3)
    } else if (point.densite_seche && point.teneur_eau) {
      point.densite_humide = (parseFloat(point.densite_seche) * (1 + point.teneur_eau / 100)).toFixed(3)
    }

    setPoints(newPoints)
  }

  const addPoint = () => {
    setPoints([...points, { teneur_eau: '', masse_humide: '', masse_seche: '', volume: '', densite_humide: '', densite_seche: '' }])
  }

  const removePoint = (index) => {
    if (points.length > 1) {
      setPoints(points.filter((_, i) => i !== index))
    }
  }

  const calculateResults = async () => {
    if (!essaiId) {
      toast.error('Veuillez d\'abord créer l\'essai')
      return
    }

    if (points.filter(p => p.teneur_eau && p.densite_seche).length < 3) {
      toast.error('Au moins 3 points complets sont nécessaires')
      return
    }

    setLoading(true)
    try {
      const data = {
        essai_id: essaiId,
        ...Object.fromEntries(
          Object.entries(formData).map(([key, value]) => [
            key,
            value === '' ? null : (typeof value === 'string' && !isNaN(value) ? parseFloat(value) : value)
          ])
        ),
        points_mesure: points.map(p => ({
          ...Object.fromEntries(
            Object.entries(p).map(([key, value]) => [
              key,
              value === '' ? null : (typeof value === 'string' && !isNaN(value) ? parseFloat(value) : value)
            ])
          )
        }))
      }

      let response
      if (initialData?.id) {
        response = await api.put(`/essais/proctor/${initialData.id}`, data)
      } else {
        response = await api.post('/essais/proctor/', data)
      }

      setResults({
        opm: response.data.opm,
        densite_seche_max: response.data.densite_seche_max,
        densite_humide_max: response.data.densite_humide_max,
        saturation_optimale: response.data.saturation_optimale,
        courbe_proctor: response.data.courbe_proctor
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

  // Préparer les données pour le graphique
  const chartData = points
    .filter(p => p.teneur_eau && p.densite_seche)
    .map(p => ({
      teneur_eau: parseFloat(p.teneur_eau),
      densite_seche: parseFloat(p.densite_seche),
      name: `Point ${points.indexOf(p) + 1}`
    }))
    .sort((a, b) => a.teneur_eau - b.teneur_eau)

  const courbeData = results?.courbe_proctor?.map(p => ({
    teneur_eau: p.teneur_eau,
    densite_seche: p.densite_seche,
    name: 'Courbe Proctor'
  }))

  return (
    <div className="space-y-6">
      {/* Paramètres généraux */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Paramètres de l'essai Proctor - NF P94-093
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Type de Proctor</label>
            <select
              name="type_proctor"
              value={formData.type_proctor}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="modifie">Modifié</option>
              <option value="cbr">CBR</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Diamètre moule (mm)</label>
            <input
              type="number"
              step="0.1"
              name="diametre_moule"
              value={formData.diametre_moule}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="152.4"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Hauteur moule (mm)</label>
            <input
              type="number"
              step="0.1"
              name="hauteur_moule"
              value={formData.hauteur_moule}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="116.4"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Volume moule (cm³)</label>
            <input
              type="number"
              step="0.1"
              name="volume_moule"
              value={formData.volume_moule}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="2124"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Nombre de couches</label>
            <input
              type="number"
              name="nombre_couches"
              value={formData.nombre_couches}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="3"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Nombre de coups/couche</label>
            <input
              type="number"
              name="nombre_coups"
              value={formData.nombre_coups}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="25"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Masse moule vide (g)</label>
            <input
              type="number"
              step="0.1"
              name="masse_moule_vide"
              value={formData.masse_moule_vide}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Points de mesure */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Points de mesure
          </h3>
          <button
            onClick={addPoint}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un point
          </button>
        </div>

        <div className="space-y-4">
          {points.map((point, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">Point {index + 1}</h4>
                {points.length > 1 && (
                  <button
                    onClick={() => removePoint(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Teneur eau (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={point.teneur_eau}
                    onChange={(e) => handlePointChange(index, 'teneur_eau', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Masse humide (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={point.masse_humide}
                    onChange={(e) => handlePointChange(index, 'masse_humide', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Masse sèche (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={point.masse_seche}
                    onChange={(e) => handlePointChange(index, 'masse_seche', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Volume (cm³)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={point.volume}
                    onChange={(e) => handlePointChange(index, 'volume', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Densité humide</label>
                  <input
                    type="number"
                    step="0.001"
                    value={point.densite_humide}
                    onChange={(e) => handlePointChange(index, 'densite_humide', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Densité sèche</label>
                  <input
                    type="number"
                    step="0.001"
                    value={point.densite_seche}
                    onChange={(e) => handlePointChange(index, 'densite_seche', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100 font-semibold"
                    readOnly
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graphique */}
      {(points.length > 0 || results) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <ProctorGraph 
            data={{
              points_mesure: points,
              opm: results?.opm,
              densite_seche_max: results?.densite_seche_max,
              courbe_proctor: results?.courbe_proctor
            }} 
          />
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
            {results.opm && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">OPM</div>
                <div className="text-2xl font-bold text-blue-600">{results.opm}%</div>
                <div className="text-xs text-gray-600">Optimum Proctor</div>
              </div>
            )}
            {results.densite_seche_max && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">ρd max</div>
                <div className="text-2xl font-bold text-green-600">{results.densite_seche_max}</div>
                <div className="text-xs text-gray-600">g/cm³</div>
              </div>
            )}
            {results.densite_humide_max && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">ρh max</div>
                <div className="text-2xl font-bold text-purple-600">{results.densite_humide_max}</div>
                <div className="text-xs text-gray-600">g/cm³</div>
              </div>
            )}
            {results.saturation_optimale && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">S</div>
                <div className="text-2xl font-bold text-orange-600">{results.saturation_optimale}%</div>
                <div className="text-xs text-gray-600">Saturation optimale</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bouton de calcul */}
      <div className="flex justify-end">
        <button
          onClick={calculateResults}
          disabled={loading || !essaiId || chartData.length < 3}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          <Calculator className="w-5 h-5" />
          {loading ? 'Calcul en cours...' : 'Calculer les résultats'}
        </button>
      </div>
    </div>
  )
}

export default ProctorForm

