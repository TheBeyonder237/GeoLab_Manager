import { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, Filter, Search, User, CheckCircle2, Clock } from 'lucide-react';
import api from '../services/api';

const STATUT_LABELS = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  resolu: 'Résolu',
};

const STATUT_COLORS = {
  ouvert: 'bg-red-50 text-red-700 border-red-200',
  en_cours: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  resolu: 'bg-green-50 text-green-700 border-green-200',
};

const TYPE_LABELS = {
  materiel: 'Matériel',
  methode: 'Méthode',
  personnel: 'Personnel',
  environnement: 'Environnement',
};

export default function QualityNonConformites() {
  const [nonConformites, setNonConformites] = useState([]);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    return nonConformites.filter((nc) => {
      const matchSearch =
        !search ||
        nc.reference.toLowerCase().includes(search.toLowerCase()) ||
        nc.titre.toLowerCase().includes(search.toLowerCase()) ||
        nc.responsable.toLowerCase().includes(search.toLowerCase());
      const matchStatut = !statut || nc.statut === statut;
      const matchType = !type || nc.type === type;
      return matchSearch && matchStatut && matchType;
    });
  }, [search, statut, type, nonConformites]);

  const total = nonConformites.length;
  const ouverts = nonConformites.filter((nc) => nc.statut === 'ouvert').length;
  const resolus = nonConformites.filter((nc) => nc.statut === 'resolu').length;

  useEffect(() => {
    const fetchNC = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/qualite/non-conformites');
        const data = Array.isArray(response.data) ? response.data : [];

        const mapped = data.map((nc) => ({
          id: nc.id,
          reference: nc.id ? `NC-${String(nc.id).padStart(4, '0')}` : '',
          titre: nc.titre || '',
          type: nc.type || 'autre',
          gravite: nc.gravite || 1,
          statut: nc.date_resolution ? 'resolu' : 'ouvert',
          responsable:
            nc.responsable?.full_name || nc.responsable?.username || '—',
          date: nc.created_at ? String(nc.created_at).substring(0, 10) : '',
        }));

        setNonConformites(mapped);
      } catch (err) {
        console.error('Erreur lors du chargement des non-conformités :', err);
        setError("Impossible de charger les non-conformités depuis le serveur.");
        // On garde les données mock en fallback
      } finally {
        setLoading(false);
      }
    };

    fetchNC();
  }, []);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Non-conformités
          </h1>
          <p className="text-gray-600 mt-1">
            Suivi des non-conformités, actions correctives et statut de traitement.
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total NC</p>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-4 h-4 text-red-500" /> Ouvertes
          </p>
          <p className="text-2xl font-bold text-red-700">{ouverts}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Résolues
          </p>
          <p className="text-2xl font-bold text-green-700">{resolus}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par référence, titre, responsable..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Tous les statuts</option>
              <option value="ouvert">Ouvert</option>
              <option value="en_cours">En cours</option>
              <option value="resolu">Résolu</option>
            </select>
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Tous les types</option>
            <option value="materiel">Matériel</option>
            <option value="methode">Méthode</option>
            <option value="personnel">Personnel</option>
            <option value="environnement">Environnement</option>
          </select>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gravité</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filtered.map((nc) => (
              <tr key={nc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{nc.reference}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{nc.titre}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{TYPE_LABELS[nc.type]}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{nc.gravite}/5</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUT_COLORS[nc.statut]}`}>
                    {STATUT_LABELS[nc.statut]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {nc.responsable}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{nc.date}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                  Aucune non-conformité ne correspond à ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
