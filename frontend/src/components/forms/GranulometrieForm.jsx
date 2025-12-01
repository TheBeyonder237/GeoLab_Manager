import { useState, useEffect } from 'react'
import { Plus, Trash2, Calculator, BarChart3, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import GranulometrieGraph from '../graphs/GranulometrieGraph'

// Tamis standards
const STANDARD_TAMIS = [
  '80mm', '63mm', '50mm', '40mm', '31.5mm', '25mm', '20mm', '16mm', '12.5mm', '10mm',
  '8mm', '6.3mm', '5mm', '4mm', '3.15mm', '2.5mm', '2mm', '1.6mm', '1.25mm', '1mm',
  '0.8mm', '0.63mm', '0.5mm', '0.4mm', '0.315mm', '0.25mm', '0.2mm', '0.16mm', '0.125mm', '0.1mm',
  '0.08mm', '0.063mm', '0.05mm', '0.04mm'
]

function GranulometrieForm({ essaiId, initialData, onSave }) {
  const [formData, setFormData] = useState({
    type_essai: 'tamisage',
    methode: 'seche',
    masse_totale_seche: '',
    masse_apres_lavage: '',
    pourcentage_fines: '',
    temperature_sedimentometrie: '',
    viscosite_dynamique: '',
  })

  const [tamisagePoints, setTamisagePoints] = useState([
    { tamis: '', masse_retenu: '', pourcentage_retenu: '', pourcentage_cumule: '', pourcentage_passant: '' }
  ])

  const [sedimentometriePoints, setSedimentometriePoints] = useState([
    { temps_min: '', hauteur_cm: '', diametre_mm: '', pourcentage_passant: '' }
  ])

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
      if (initialData.points_tamisage) {
        setTamisagePoints(initialData.points_tamisage.length > 0 
          ? initialData.points_tamisage 
          : [{ tamis: '', masse_retenu: '', pourcentage_retenu: '', pourcentage_cumule: '', pourcentage_passant: '' }])
      }
      if (initialData.points_sedimentometrie) {
        setSedimentometriePoints(initialData.points_sedimentometrie.length > 0
          ? initialData.points_sedimentometrie
          : [{ temps_min: '', hauteur_cm: '', diametre_mm: '', pourcentage_passant: '' }])
      }
      if (initialData.d10 || initialData.d50 || initialData.cu) {
        setResults({
          d10: initialData.d10,
          d16: initialData.d16,
          d30: initialData.d30,
          d50: initialData.d50,
          d60: initialData.d60,
          d84: initialData.d84,
          cu: initialData.cu,
          cc: initialData.cc,
          classe_granulometrique: initialData.classe_granulometrique,
          pourcentage_gravier: initialData.pourcentage_gravier,
          pourcentage_sable: initialData.pourcentage_sable,
          pourcentage_limon: initialData.pourcentage_limon,
          pourcentage_argile: initialData.pourcentage_argile
        })
      }
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : (name.includes('masse') || name.includes('pourcentage') || name.includes('temperature') || name.includes('viscosite') ? parseFloat(value) || '' : value)
    }))
  }

  const handleTamisageChange = (index, field, value) => {
    const newPoints = [...tamisagePoints]
    newPoints[index] = {
      ...newPoints[index],
      [field]: value === '' ? '' : (field === 'masse_retenu' ? parseFloat(value) || '' : value)
    }
    
    // Calculer automatiquement les pourcentages
    const masseTotale = parseFloat(formData.masse_totale_seche) || 1000
    let masseCumulee = 0
    
    newPoints.forEach((point, i) => {
      if (i <= index) {
        const masse = parseFloat(point.masse_retenu) || 0
        masseCumulee += masse
        const pourcentageRetenu = (masse / masseTotale) * 100
        const pourcentageCumule = (masseCumulee / masseTotale) * 100
        const pourcentagePassant = 100 - pourcentageCumule
        
        newPoints[i] = {
          ...newPoints[i],
          pourcentage_retenu: pourcentageRetenu.toFixed(2),
          pourcentage_cumule: pourcentageCumule.toFixed(2),
          pourcentage_passant: pourcentagePassant.toFixed(2)
        }
      }
    })
    
    setTamisagePoints(newPoints)
  }

  const addTamisagePoint = () => {
    setTamisagePoints([...tamisagePoints, { tamis: '', masse_retenu: '', pourcentage_retenu: '', pourcentage_cumule: '', pourcentage_passant: '' }])
  }

  const removeTamisagePoint = (index) => {
    if (tamisagePoints.length > 1) {
      setTamisagePoints(tamisagePoints.filter((_, i) => i !== index))
    }
  }

  const handleSedimentometrieChange = (index, field, value) => {
    const newPoints = [...sedimentometriePoints]
    newPoints[index] = {
      ...newPoints[index],
      [field]: value === '' ? '' : parseFloat(value) || ''
    }
    setSedimentometriePoints(newPoints)
  }

  const addSedimentometriePoint = () => {
    setSedimentometriePoints([...sedimentometriePoints, { temps_min: '', hauteur_cm: '', diametre_mm: '', pourcentage_passant: '' }])
  }

  const removeSedimentometriePoint = (index) => {
    if (sedimentometriePoints.length > 1) {
      setSedimentometriePoints(sedimentometriePoints.filter((_, i) => i !== index))
    }
  }

  const calculateResults = async () => {
    if (!essaiId) {
      toast.error('Veuillez d\'abord créer l\'essai')
      return
    }

    if (tamisagePoints.filter(p => p.tamis && p.masse_retenu).length < 2) {
      toast.error('Au moins 2 points de tamisage sont nécessaires')
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
        points_tamisage: tamisagePoints
          .filter(p => p.tamis && p.masse_retenu)
          .map(p => ({
            tamis: p.tamis,
            masse_retenu: parseFloat(p.masse_retenu),
            pourcentage_retenu: parseFloat(p.pourcentage_retenu) || null,
            pourcentage_cumule: parseFloat(p.pourcentage_cumule) || null,
            pourcentage_passant: parseFloat(p.pourcentage_passant) || null
          })),
        points_sedimentometrie: formData.type_essai === 'mixte' || formData.type_essai === 'sedimentometrie'
          ? sedimentometriePoints
              .filter(p => p.temps_min && p.pourcentage_passant)
              .map(p => ({
                temps_min: parseFloat(p.temps_min),
                hauteur_cm: parseFloat(p.hauteur_cm) || null,
                diametre_mm: parseFloat(p.diametre_mm) || null,
                pourcentage_passant: parseFloat(p.pourcentage_passant)
              }))
          : null
      }

      let response
      if (initialData?.id) {
        response = await api.put(`/essais/granulometrie/${initialData.id}`, data)
      } else {
        response = await api.post('/essais/granulometrie/', data)
      }

      setResults({
        d10: response.data.d10,
        d16: response.data.d16,
        d30: response.data.d30,
        d50: response.data.d50,
        d60: response.data.d60,
        d84: response.data.d84,
        cu: response.data.cu,
        cc: response.data.cc,
        classe_granulometrique: response.data.classe_granulometrique,
        pourcentage_gravier: response.data.pourcentage_gravier,
        pourcentage_sable: response.data.pourcentage_sable,
        pourcentage_limon: response.data.pourcentage_limon,
        pourcentage_argile: response.data.pourcentage_argile
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

  // Préparer les données pour le graphique (échelle logarithmique)
  const chartData = tamisagePoints
    .filter(p => p.tamis && p.pourcentage_passant)
    .map(p => {
      // Convertir tamis en diamètre (simplifié)
      const diametre = parseFloat(p.tamis.replace('mm', '')) || 0
      return {
        diametre: diametre,
        pourcentage_passant: parseFloat(p.pourcentage_passant),
        name: p.tamis
      }
    })
    .sort((a, b) => b.diametre - a.diametre)

  return (
    <div className="space-y-6">
      {/* Paramètres généraux */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Paramètres de l'essai - NF P94-056
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Type d'essai</label>
            <select
              name="type_essai"
              value={formData.type_essai}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="tamisage">Tamisage seul</option>
              <option value="sedimentometrie">Sédimentométrie seul</option>
              <option value="mixte">Mixte (Tamisage + Sédimentométrie)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Méthode</label>
            <select
              name="methode"
              value={formData.methode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="seche">Sèche</option>
              <option value="humide">Humide</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Masse totale sèche (g)</label>
            <input
              type="number"
              step="0.1"
              name="masse_totale_seche"
              value={formData.masse_totale_seche}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="1000"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Masse après lavage (g)</label>
            <input
              type="number"
              step="0.1"
              name="masse_apres_lavage"
              value={formData.masse_apres_lavage}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Points de tamisage */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Points de tamisage
          </h3>
          <button
            onClick={addTamisagePoint}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un tamis
          </button>
        </div>

        <div className="space-y-4">
          {tamisagePoints.map((point, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">Tamis {index + 1}</h4>
                {tamisagePoints.length > 1 && (
                  <button
                    onClick={() => removeTamisagePoint(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tamis</label>
                  <select
                    value={point.tamis}
                    onChange={(e) => handleTamisageChange(index, 'tamis', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {STANDARD_TAMIS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Masse retenue (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={point.masse_retenu}
                    onChange={(e) => handleTamisageChange(index, 'masse_retenu', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">% Retenu</label>
                  <input
                    type="number"
                    step="0.01"
                    value={point.pourcentage_retenu}
                    readOnly
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">% Cumulé</label>
                  <input
                    type="number"
                    step="0.01"
                    value={point.pourcentage_cumule}
                    readOnly
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">% Passant</label>
                  <input
                    type="number"
                    step="0.01"
                    value={point.pourcentage_passant}
                    readOnly
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100 font-semibold"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sédimentométrie (si mixte ou sédimentométrie seule) */}
      {(formData.type_essai === 'mixte' || formData.type_essai === 'sedimentometrie') && (
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-purple-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Points de sédimentométrie
            </h3>
            <button
              onClick={addSedimentometriePoint}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un point
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Température (°C)</label>
              <input
                type="number"
                step="0.1"
                name="temperature_sedimentometrie"
                value={formData.temperature_sedimentometrie}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="20"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Viscosité dynamique (Pa.s)</label>
              <input
                type="number"
                step="0.000001"
                name="viscosite_dynamique"
                value={formData.viscosite_dynamique}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            {sedimentometriePoints.map((point, index) => (
              <div key={index} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">Point {index + 1}</h4>
                  {sedimentometriePoints.length > 1 && (
                    <button
                      onClick={() => removeSedimentometriePoint(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Temps (min)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={point.temps_min}
                      onChange={(e) => handleSedimentometrieChange(index, 'temps_min', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hauteur (cm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={point.hauteur_cm}
                      onChange={(e) => handleSedimentometrieChange(index, 'hauteur_cm', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Diamètre (mm)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={point.diametre_mm}
                      onChange={(e) => handleSedimentometrieChange(index, 'diametre_mm', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">% Passant</label>
                    <input
                      type="number"
                      step="0.01"
                      value={point.pourcentage_passant}
                      onChange={(e) => handleSedimentometrieChange(index, 'pourcentage_passant', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graphique courbe granulométrique */}
      {(tamisagePoints.length > 0 || results) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <GranulometrieGraph 
            data={{
              points_tamisage: tamisagePoints.filter(p => p.tamis && p.pourcentage_passant),
              points_sedimentometrie: formData.type_essai !== 'tamisage' ? sedimentometriePoints : undefined,
              d10: results?.d10,
              d30: results?.d30,
              d60: results?.d60
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {results.d10 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">D10</div>
                <div className="text-2xl font-bold text-blue-600">{results.d10} mm</div>
              </div>
            )}
            {results.d30 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">D30</div>
                <div className="text-2xl font-bold text-green-600">{results.d30} mm</div>
              </div>
            )}
            {results.d50 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">D50</div>
                <div className="text-2xl font-bold text-purple-600">{results.d50} mm</div>
              </div>
            )}
            {results.d60 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">D60</div>
                <div className="text-2xl font-bold text-orange-600">{results.d60} mm</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {results.cu && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">CU</div>
                <div className="text-2xl font-bold text-indigo-600">{results.cu}</div>
                <div className="text-xs text-gray-600">Coefficient d'uniformité</div>
              </div>
            )}
            {results.cc && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase">CC</div>
                <div className="text-2xl font-bold text-pink-600">{results.cc}</div>
                <div className="text-xs text-gray-600">Coefficient de courbure</div>
              </div>
            )}
          </div>

          {results.classe_granulometrique && (
            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <div className="text-sm font-medium text-gray-700 mb-1">Classification</div>
              <div className="text-lg font-semibold text-gray-800">{results.classe_granulometrique}</div>
            </div>
          )}

          {(results.pourcentage_gravier || results.pourcentage_sable || results.pourcentage_limon || results.pourcentage_argile) && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm font-medium text-gray-700 mb-3">Répartition granulométrique</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {results.pourcentage_gravier !== undefined && (
                  <div>
                    <div className="text-xs text-gray-600">Gravier</div>
                    <div className="text-lg font-bold text-gray-800">{results.pourcentage_gravier}%</div>
                  </div>
                )}
                {results.pourcentage_sable !== undefined && (
                  <div>
                    <div className="text-xs text-gray-600">Sable</div>
                    <div className="text-lg font-bold text-gray-800">{results.pourcentage_sable}%</div>
                  </div>
                )}
                {results.pourcentage_limon !== undefined && (
                  <div>
                    <div className="text-xs text-gray-600">Limon</div>
                    <div className="text-lg font-bold text-gray-800">{results.pourcentage_limon}%</div>
                  </div>
                )}
                {results.pourcentage_argile !== undefined && (
                  <div>
                    <div className="text-xs text-gray-600">Argile</div>
                    <div className="text-lg font-bold text-gray-800">{results.pourcentage_argile}%</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bouton de calcul */}
      <div className="flex justify-end">
        <button
          onClick={calculateResults}
          disabled={loading || !essaiId || tamisagePoints.filter(p => p.tamis && p.masse_retenu).length < 2}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          <Calculator className="w-5 h-5" />
          {loading ? 'Calcul en cours...' : 'Calculer les résultats'}
        </button>
      </div>
    </div>
  )
}

export default GranulometrieForm

