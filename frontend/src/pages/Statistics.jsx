import { useEffect, useState, useMemo } from 'react'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

function Statistics() {
  const [stats, setStats] = useState(null)
  const [techniciens, setTechniciens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError('')
      const [dashboardRes, techniciensRes] = await Promise.all([
        api.get('/statistiques/dashboard'),
        api.get('/statistiques/par-technicien')
      ])
      setStats(dashboardRes.data)
      setTechniciens(techniciensRes.data?.techniciens || [])
    } catch (err) {
      console.error('Erreur:', err)
      setError("Impossible de charger les statistiques.")
    } finally {
      setLoading(false)
    }
  }

  const moisData = useMemo(() => {
    if (!stats?.par_mois) return []
    const sorted = [...stats.par_mois].sort((a, b) => {
      if (a.annee === b.annee) return a.mois - b.mois
      return a.annee - b.annee
    })
    return sorted.map((item) => ({
      name: `${String(item.mois).padStart(2, '0')}/${item.annee}`,
      essais: item.count
    }))
  }, [stats])

  const typeData = useMemo(() => {
    if (!stats?.par_type) return []
    const labels = {
      atterberg: "Limites d'Atterberg",
      cbr: 'CBR',
      proctor: 'Proctor',
      granulometrie: 'Granulométrie',
      autre: 'Autre'
    }
    return Object.entries(stats.par_type).map(([type, count]) => ({
      type: labels[type] || type,
      essais: count
    }))
  }, [stats])

  const statutData = useMemo(() => {
    if (!stats?.par_statut) return []
    const labels = {
      brouillon: 'Brouillon',
      en_cours: 'En cours',
      termine: 'Terminé',
      valide: 'Validé'
    }
    return Object.entries(stats.par_statut).map(([statut, count]) => ({
      statut: labels[statut] || statut,
      essais: count
    }))
  }, [stats])

  const technicienData = useMemo(() => {
    return (techniciens || []).map((t) => ({
      nom: t.full_name || t.username,
      essais: t.nombre_essais,
      valides: t.essais_valides
    }))
  }, [techniciens])

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center py-12">Aucune statistique disponible</div>
  }

  const totalValides = stats.par_statut?.valide || 0
  const topTechnicien = technicienData[0]

  return (
    <div className="px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analyses &amp; Statistiques</h1>
          <p className="text-gray-600 mt-1">
            Vue d&apos;ensemble de l&apos;activité du laboratoire et des essais réalisés.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Essais au total</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{stats.total_essais}</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-4">
          <p className="text-sm text-gray-500">Essais récents (7 jours)</p>
          <p className="mt-1 text-3xl font-bold text-blue-700">{stats.essais_recents_7j}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4">
          <p className="text-sm text-gray-500">Essais validés</p>
          <p className="mt-1 text-3xl font-bold text-green-700">{totalValides}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Technicien le plus actif</p>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {topTechnicien ? topTechnicien.nom : '—'}
          </p>
          {topTechnicien && (
            <p className="text-xs text-gray-500 mt-1">
              {topTechnicien.essais} essais, {topTechnicien.valides} validés
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Évolution mensuelle des essais (6 derniers mois)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={moisData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="essais" stroke="#0ea5e9" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Répartition par type d&apos;essai
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="essais" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Répartition par statut
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statutData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="statut" />
              <Tooltip />
              <Legend />
              <Bar dataKey="essais" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Activité par technicien
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={technicienData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nom" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="essais" name="Essais réalisés" fill="#0ea5e9" />
              <Bar dataKey="valides" name="Essais validés" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Statistics

