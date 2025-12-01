import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GitCompare, Plus, X, FileText, ArrowLeft, Download } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchEssais } from '../store/slices/essaisSlice'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import InteractiveChart from '../components/charts/InteractiveChart'

function ComparisonPage() {
  const dispatch = useDispatch()
  const { essais } = useSelector((state) => state.essais)
  const [selectedEssais, setSelectedEssais] = useState([])
  const [essaiDetails, setEssaiDetails] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchEssais({ limit: 1000 }))
  }, [dispatch])

  const handleSelectEssai = (essaiId) => {
    if (selectedEssais.includes(essaiId)) {
      setSelectedEssais(selectedEssais.filter(id => id !== essaiId))
      const newDetails = { ...essaiDetails }
      delete newDetails[essaiId]
      setEssaiDetails(newDetails)
    } else if (selectedEssais.length < 3) {
      setSelectedEssais([...selectedEssais, essaiId])
      loadEssaiDetails(essaiId)
    } else {
      toast.error('Vous ne pouvez comparer que 3 essais maximum')
    }
  }

  const loadEssaiDetails = async (essaiId) => {
    try {
      setLoading(true)
      const response = await api.get(`/essais/${essaiId}`)
      setEssaiDetails(prev => ({
        ...prev,
        [essaiId]: response.data
      }))
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast.error('Erreur lors du chargement des détails')
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type) => {
    const labels = {
      atterberg: "Limites d'Atterberg",
      cbr: "CBR",
      proctor: "Proctor",
      granulometrie: "Granulométrie",
      autre: "Autre",
    }
    return labels[type] || type
  }

  const buildProctorChartConfig = () => {
    const allTeneurs = new Set()
    const dataParEssai = {}

    selectedEssais.forEach((id) => {
      const essai = essaiDetails[id]
      const proctor = essai?.proctor
      if (!proctor || !Array.isArray(proctor.points_mesure)) {
        return
      }
      const points = proctor.points_mesure.filter(
        (p) =>
          typeof p.teneur_eau === 'number' &&
          typeof p.densite_seche === 'number'
      )
      if (!points.length) {
        return
      }
      dataParEssai[id] = points
      points.forEach((p) => allTeneurs.add(p.teneur_eau))
    })

    const teneurs = Array.from(allTeneurs).sort((a, b) => a - b)

    const data = teneurs.map((t) => {
      const row = { teneur_eau: t }
      selectedEssais.forEach((id) => {
        const points = dataParEssai[id]
        if (!points) {
          row[`essai_${id}`] = null
          return
        }
        const point = points.find((p) => p.teneur_eau === t)
        row[`essai_${id}`] = point ? point.densite_seche : null
      })
      return row
    })

    const series = selectedEssais
      .filter((id) => dataParEssai[id])
      .map((id) => ({
        dataKey: `essai_${id}`,
        name: essaiDetails[id]?.numero_essai || `Essai ${id}`
      }))

    return { data, series }
  }

  const buildCbrChartConfig = () => {
    const allPenetrations = new Set()
    const dataParEssai = {}

    selectedEssais.forEach((id) => {
      const essai = essaiDetails[id]
      const cbr = essai?.cbr
      if (!cbr || !Array.isArray(cbr.points_penetration)) {
        return
      }
      const points = cbr.points_penetration.filter(
        (p) =>
          typeof p.penetration_mm === 'number' &&
          typeof p.force_kN === 'number'
      )
      if (!points.length) {
        return
      }
      dataParEssai[id] = points
      points.forEach((p) => allPenetrations.add(p.penetration_mm))
    })

    const penetrations = Array.from(allPenetrations).sort((a, b) => a - b)

    const data = penetrations.map((x) => {
      const row = { penetration: x }
      selectedEssais.forEach((id) => {
        const points = dataParEssai[id]
        if (!points) {
          row[`essai_${id}`] = null
          return
        }
        const point = points.find((p) => p.penetration_mm === x)
        row[`essai_${id}`] = point ? point.force_kN : null
      })
      return row
    })

    const series = selectedEssais
      .filter((id) => dataParEssai[id])
      .map((id) => ({
        dataKey: `essai_${id}`,
        name: essaiDetails[id]?.numero_essai || `Essai ${id}`
      }))

    return { data, series }
  }

  const renderComparisonCharts = () => {
    if (selectedEssais.length < 2) {
      return null
    }
    const firstEssai = essaiDetails[selectedEssais[0]]
    if (!firstEssai) {
      return null
    }
    const type = firstEssai.type_essai
    const sameType = selectedEssais.every(
      (id) => essaiDetails[id]?.type_essai === type
    )
    if (!sameType) {
      return null
    }

    if (type === 'proctor') {
      const { data, series } = buildProctorChartConfig()
      if (!data.length || !series.length) {
        return null
      }
      return (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Courbe Proctor comparée
          </h3>
          <InteractiveChart
            data={data}
            series={series}
            xAxis={{ dataKey: 'teneur_eau', label: "Teneur en eau (%)" }}
            yAxis={{ label: 'Densité sèche (g/cm³)' }}
            type="line"
            height={360}
            grid
            zoom={false}
            brush={false}
            theme="light"
          />
        </div>
      )
    }

    if (type === 'cbr') {
      const { data, series } = buildCbrChartConfig()
      if (!data.length || !series.length) {
        return null
      }
      return (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Courbes CBR comparées
          </h3>
          <InteractiveChart
            data={data}
            series={series}
            xAxis={{ dataKey: 'penetration', label: 'Pénétration (mm)', type: 'number' }}
            yAxis={{ label: 'Force (kN)' }}
            type="line"
            height={360}
            grid
            zoom={false}
            brush={false}
            theme="light"
          />
        </div>
      )
    }

    return null
  }

  const renderComparisonTable = () => {
    if (selectedEssais.length < 2) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <GitCompare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Sélectionnez au moins 2 essais pour comparer</p>
        </div>
      )
    }

    const fields = [
      { label: 'Numéro', key: 'numero_essai' },
      { label: 'Type', key: 'type_essai', format: (v) => getTypeLabel(v) },
      { label: 'Statut', key: 'statut' },
      { label: 'Projet', key: 'projet' },
      { label: 'Échantillon', key: 'echantillon' },
      { label: 'Date', key: 'date_essai', format: (v) => format(new Date(v), 'dd/MM/yyyy', { locale: fr }) },
      { label: 'Opérateur', key: 'operateur', format: (v) => v?.full_name || v?.username || 'N/A' },
    ]

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Propriété
                </th>
                {selectedEssais.map((id) => {
                  const essai = essaiDetails[id]
                  return (
                    <th key={id} className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {essai?.numero_essai || `Essai #${id}`}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fields.map((field) => (
                <tr key={field.key} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {field.label}
                  </td>
                  {selectedEssais.map((id) => {
                    const essai = essaiDetails[id]
                    const value = essai?.[field.key]
                    const displayValue = field.format ? field.format(value) : (value || 'N/A')
                    return (
                      <td key={id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {displayValue}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Comparaison des résultats */}
        {selectedEssais.every(id => essaiDetails[id]?.resultats) && (
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparaison des résultats</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Paramètre</th>
                    {selectedEssais.map((id) => {
                      const essai = essaiDetails[id]
                      return (
                        <th key={id} className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                          {essai?.numero_essai}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.keys(essaiDetails[selectedEssais[0]]?.resultats || {}).map((key) => (
                    <tr key={key}>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{key}</td>
                      {selectedEssais.map((id) => {
                        const resultats = essaiDetails[id]?.resultats || {}
                        return (
                          <td key={id} className="px-4 py-2 text-sm text-gray-600">
                            {resultats[key] !== undefined ? resultats[key] : 'N/A'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <GitCompare className="w-8 h-8" />
              Comparaison d'essais
            </h1>
            <p className="text-gray-600 mt-1">Comparez jusqu'à 3 essais côte à côte</p>
          </div>
        </div>
      </div>

      {/* Liste des essais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {essais.map((essai) => {
          const isSelected = selectedEssais.includes(essai.id)
          return (
            <div
              key={essai.id}
              onClick={() => handleSelectEssai(essai.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {isSelected && (
                      <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900">{essai.numero_essai}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{getTypeLabel(essai.type_essai)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(essai.date_essai), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
                <FileText className={`w-5 h-5 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Tableau de comparaison */}
      {selectedEssais.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Comparaison ({selectedEssais.length} essai{selectedEssais.length > 1 ? 's' : ''})
            </h2>
            <button
              onClick={() => {
                setSelectedEssais([])
                setEssaiDetails({})
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Chargement des détails...</p>
            </div>
          ) : (
            <>
              {renderComparisonTable()}
              {renderComparisonCharts()}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ComparisonPage

