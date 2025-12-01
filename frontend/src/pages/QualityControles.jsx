import { useState, useMemo, useEffect } from 'react';
import { Shield, Filter, Search, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const STATUT_LABELS = {
  planifie: 'Planifié',
  en_cours: 'En cours',
  termine: 'Terminé',
  en_retard: 'En retard',
  non_conforme: 'Non conforme',
};

const STATUT_COLORS = {
  planifie: 'bg-blue-50 text-blue-700 border-blue-200',
  en_cours: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  termine: 'bg-green-50 text-green-700 border-green-200',
  en_retard: 'bg-red-50 text-red-700 border-red-200',
  non_conforme: 'bg-red-50 text-red-700 border-red-200',
};

export default function QualityControles() {
  const [controles, setControles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');

  const filtered = useMemo(() => {
    return controles.filter((c) => {
      const matchSearch =
        !search ||
        c.reference.toLowerCase().includes(search.toLowerCase()) ||
        c.type.toLowerCase().includes(search.toLowerCase()) ||
        c.equipement.toLowerCase().includes(search.toLowerCase());
      const matchStatut = !statut || c.statut === statut;
      return matchSearch && matchStatut;
    });
  }, [search, statut, controles]);

  const total = controles.length;
  const enRetard = controles.filter((c) => c.statut === 'en_retard' || c.statut === 'non_conforme').length;
  const enCours = controles.filter((c) => c.statut === 'en_cours').length;
  const termines = controles.filter((c) => c.statut === 'termine').length;

  useEffect(() => {
    const fetchControles = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/qualite/controles');
        const data = Array.isArray(response.data) ? response.data : [];

        const mapped = data.map((c) => ({
          id: c.id,
          reference: c.id ? `CQ-${String(c.id).padStart(4, '0')}` : c.reference || '',
          type: c.titre || c.type || '',
          equipement: c.resultats?.equipement || c.resultats?.equipement_nom || '—',
          datePrevue: c.date_prevue ? String(c.date_prevue).substring(0, 10) : '',
          statut: c.statut || 'planifie',
          responsable: c.responsable?.full_name || c.responsable?.username || '—',
        }));

        setControles(mapped);
      } catch (err) {
        console.error('Erreur lors du chargement des contrôles qualité :', err);
        setError("Impossible de charger les contrôles qualité depuis le serveur.");
        // On garde les données mock en fallback
      } finally {
        setLoading(false);
      }
    };

    fetchControles();
  }, []);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Contrôles qualité
          </h1>
          <p className="text-gray-600 mt-1">
            Suivi des contrôles qualité planifiés sur les équipements et essais.
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total contrôles</p>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 p-4">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-4 h-4 text-yellow-500" /> En cours
          </p>
          <p className="text-2xl font-bold text-yellow-700">{enCours}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Terminés
          </p>
          <p className="text-2xl font-bold text-green-700">{termines}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-red-500" /> En retard
          </p>
          <p className="text-2xl font-bold text-red-700">{enRetard}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par référence, type, équipement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="planifie">Planifié</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="en_retard">En retard</option>
            </select>
          </div>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Équipement</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date prévue</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.reference}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{c.type}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{c.equipement}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{c.datePrevue}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUT_COLORS[c.statut]}`}>
                    {STATUT_LABELS[c.statut]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{c.responsable}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  Aucun contrôle ne correspond à ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
