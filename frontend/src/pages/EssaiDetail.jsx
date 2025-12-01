import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ArrowLeft, Download, Edit, FileText, Calendar, User, Building, Package, CheckCircle, XCircle, Clock, AlertCircle, ChevronRight, Shield, History } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchEssai, updateEssai } from '../store/slices/essaisSlice'
import api from '../services/api'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import HistoryTimeline from '../components/HistoryTimeline'

function EssaiDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentEssai, loading } = useSelector((state) => state.essais)
  const { user } = useSelector((state) => state.auth)
  const [specificData, setSpecificData] = useState(null)
  const [showStatutModal, setShowStatutModal] = useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchEssai(id))
    }
  }, [dispatch, id])

  useEffect(() => {
    if (currentEssai) {
      loadSpecificData()
    }
  }, [currentEssai])

  const loadSpecificData = async () => {
    if (!currentEssai) return
    
    try {
      const endpoints = {
        atterberg: `/essais/atterberg/`,
        cbr: `/essais/cbr/`,
        proctor: `/essais/proctor/`,
        granulometrie: `/essais/granulometrie/`
      }
      
      if (endpoints[currentEssai.type_essai]) {
        const response = await api.get(endpoints[currentEssai.type_essai])
        const data = response.data.find(item => item.essai_id === parseInt(id))
        if (data) {
          setSpecificData(data)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/rapports/${id}/pdf`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `rapport_${currentEssai?.numero_essai}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Rapport PDF téléchargé avec succès')
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      toast.error('Erreur lors du téléchargement du PDF')
    }
  }

  const handleChangeStatut = async (nouveauStatut) => {
    try {
      await dispatch(updateEssai({ 
        id, 
        data: { statut: nouveauStatut } 
      })).unwrap()
      toast.success(`Statut changé en "${nouveauStatut}" avec succès`)
      setShowStatutModal(false)
      dispatch(fetchEssai(id))
    } catch (error) {
      toast.error(error || 'Erreur lors du changement de statut')
    }
  }

  const canValidate = user?.role && ['admin', 'chef_lab', 'ingenieur'].includes(user.role)
  const canEdit = currentEssai && (currentEssai.operateur_id === user?.id || canValidate)

  const getStatutBadge = (statut) => {
    const badges = {
      brouillon: "bg-gray-100 text-gray-800 border-gray-300",
      en_cours: "bg-yellow-100 text-yellow-800 border-yellow-300",
      termine: "bg-blue-100 text-blue-800 border-blue-300",
      valide: "bg-green-100 text-green-800 border-green-300",
    }
    return badges[statut] || "bg-gray-100 text-gray-800"
  }

  const getStatutIcon = (statut) => {
    switch(statut) {
      case 'valide': return <CheckCircle className="w-5 h-5" />
      case 'termine': return <CheckCircle className="w-5 h-5" />
      case 'en_cours': return <Clock className="w-5 h-5" />
      case 'brouillon': return <AlertCircle className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    )
  }

  if (!currentEssai) {
    return (
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900 mb-2">Essai non trouvé</p>
          <p className="text-gray-600 mb-6">L'essai que vous recherchez n'existe pas ou a été supprimé.</p>
          <Link
            to="/dashboard/essais"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à la liste
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {/* En-tête avec actions */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard/essais"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {currentEssai.numero_essai}
              </h1>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatutBadge(currentEssai.statut)}`}>
                  {getStatutIcon(currentEssai.statut)}
                  {currentEssai.statut}
                </span>
                <span className="text-sm text-gray-600 capitalize">
                  {currentEssai.type_essai}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStatutModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl"
            >
              <Shield className="w-5 h-5" />
              Changer statut
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
            >
              <Download className="w-5 h-5" />
              Télécharger PDF
            </button>
            {canEdit && (
              <Link
                to={`/dashboard/essais/${id}/modifier`}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Edit className="w-5 h-5" />
                Modifier
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations générales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carte informations */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Informations générales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Projet</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {currentEssai.projet_nom || currentEssai.projet || 'Non spécifié'}
                    {currentEssai.projet_id && (
                      <Link
                        to={`/projets/${currentEssai.projet_id}`}
                        className="ml-2 text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Voir le projet
                      </Link>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Échantillon</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {currentEssai.echantillon || 'Non spécifié'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-purple-100 rounded-lg p-3">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date de l'essai</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {format(new Date(currentEssai.date_essai), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-orange-100 rounded-lg p-3">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Opérateur</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {currentEssai.operateur?.full_name || currentEssai.operateur?.username || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Résultats */}
          {currentEssai.resultats && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-blue-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Résultats calculés</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(currentEssai.resultats).map(([key, value]) => {
                  if (typeof value === 'object' || key === 'note' || key === 'note_module') return null
                  return (
                    <div key={key} className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-xs text-gray-500 uppercase mb-1">{key}</p>
                      <p className="text-2xl font-bold text-blue-600">{value}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Graphiques selon le type */}
          {specificData && currentEssai.type_essai === 'proctor' && specificData.courbe_proctor && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Courbe Proctor</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={specificData.courbe_proctor}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="teneur_eau" label={{ value: 'Teneur en eau (%)', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Densité sèche (g/cm³)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="densite_seche" stroke="#3b82f6" strokeWidth={2} name="Densité sèche" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Observations */}
          {currentEssai.observations && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Observations</h2>
              <p className="text-gray-700 leading-relaxed">{currentEssai.observations}</p>
            </div>
          )}
        </div>

        {/* Sidebar avec métadonnées */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métadonnées</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Créé le</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(currentEssai.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
              {currentEssai.updated_at && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Modifié le</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(currentEssai.updated_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Workflow de statut */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Workflow de validation
            </h3>
            <div className="space-y-3">
              {['brouillon', 'en_cours', 'termine', 'valide'].map((statut, index) => {
                const isActive = currentEssai.statut === statut
                const isPast = ['brouillon', 'en_cours', 'termine', 'valide'].indexOf(currentEssai.statut) >= index
                const canChange = canValidate || (statut !== 'valide' && currentEssai.operateur_id === user?.id)
                
                return (
                  <div
                    key={statut}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      isActive
                        ? 'bg-blue-50 border-blue-500'
                        : isPast
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-blue-600 text-white' : isPast ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold capitalize ${
                        isActive ? 'text-blue-900' : isPast ? 'text-green-900' : 'text-gray-600'
                      }`}>
                        {statut.replace('_', ' ')}
                      </p>
                      {statut === 'valide' && (
                        <p className="text-xs text-gray-500">Nécessite validation par un ingénieur/chef de lab</p>
                      )}
                    </div>
                    {isActive && (
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    )}
                    {canChange && !isActive && (
                      <button
                        onClick={() => handleChangeStatut(statut)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Passer à
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {canEdit && (
                <Link
                  to={`/dashboard/essais/${id}/modifier`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  <Edit className="w-5 h-5" />
                  Modifier l'essai
                </Link>
              )}
              <button
                onClick={handleDownloadPDF}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                <Download className="w-5 h-5" />
                Télécharger PDF
              </button>
            </div>
          </div>

          {/* Historique */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <History className="w-5 h-5" />
              Historique des modifications
            </h3>
            <HistoryTimeline essaiId={id} />
          </div>
        </div>
      </div>

      {/* Modal de changement de statut */}
      {showStatutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Changer le statut</h3>
              <button
                onClick={() => setShowStatutModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              {['brouillon', 'en_cours', 'termine', 'valide'].map((statut) => {
                const isCurrent = currentEssai.statut === statut
                const canSelect = canValidate || (statut !== 'valide' && currentEssai.operateur_id === user?.id)
                
                return (
                  <button
                    key={statut}
                    onClick={() => !isCurrent && canSelect && handleChangeStatut(statut)}
                    disabled={isCurrent || !canSelect}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isCurrent
                        ? 'bg-blue-50 border-blue-500 cursor-default'
                        : canSelect
                        ? 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                        : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize text-gray-900">
                        {statut.replace('_', ' ')}
                      </span>
                      {isCurrent && <CheckCircle className="w-5 h-5 text-blue-600" />}
                      {!canSelect && statut === 'valide' && (
                        <span className="text-xs text-gray-500">Réservé aux ingénieurs/chefs de lab</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EssaiDetail
