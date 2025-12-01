import { useState, useMemo, useEffect } from 'react';
import { Wrench, Filter, Search, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import api from '../services/api';

const STATUT_LABELS = {
  a_jour: 'À jour',
  a_venir: 'À venir',
  en_retard: 'En retard',
};

const STATUT_COLORS = {
  a_jour: 'bg-green-50 text-green-700 border-green-200',
  a_venir: 'bg-blue-50 text-blue-700 border-blue-200',
  en_retard: 'bg-red-50 text-red-700 border-red-200',
};

export default function QualityCalibrations() {
  const [calibrations, setCalibrations] = useState([]);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    return calibrations.filter((c) => {
      const matchSearch =
        !search ||
        c.equipement.toLowerCase().includes(search.toLowerCase()) ||
        c.numeroSerie.toLowerCase().includes(search.toLowerCase());
      const matchStatut = !statut || c.statut === statut;
      return matchSearch && matchStatut;
    });
  }, [search, statut, calibrations]);

  const total = calibrations.length;
  const enRetard = calibrations.filter((c) => c.statut === 'en_retard').length;
  const aJour = calibrations.filter((c) => c.statut === 'a_jour').length;

  useEffect(() => {
    const fetchCalibrations = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/qualite/calibrations');
        const data = Array.isArray(response.data) ? response.data : [];

        const mapped = data.map((c) => ({
          id: c.id,
          equipement: c.equipement || '—',
          numeroSerie: c.numero_serie || c.numeroSerie || '—',
          dateDerniere: c.date_calibration ? String(c.date_calibration).substring(0, 10) : '',
          dateProchaine: c.date_prochaine ? String(c.date_prochaine).substring(0, 10) : '',
          statut: c.conforme === false ? 'en_retard' : 'a_jour',
        }));

        setCalibrations(mapped);
      } catch (err) {
        console.error('Erreur lors du chargement des calibrations :', err);
        setError("Impossible de charger les calibrations depuis le serveur.");
        // On garde les données mock en fallback
      } finally {
        setLoading(false);
      }
    };

    fetchCalibrations();
  }, []);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-purple-600" />
            Calibrations des équipements
          </h1>
          <p className="text-gray-600 mt-1">
            Suivi des dates de calibration des équipements critiques du laboratoire.
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Équipements suivis</p>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> À jour
          </p>
          <p className="text-2xl font-bold text-green-700">{aJour}</p>
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
              placeholder="Rechercher par équipement ou N° de série..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Tous les statuts</option>
              <option value="a_jour">À jour</option>
              <option value="a_venir">À venir</option>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Équipement</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° série</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière calibration</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prochaine calibration</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.equipement}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{c.numeroSerie}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{c.dateDerniere}</td>
                <td className="px-4 py-3 text-sm text-gray-700 flex items-center gap-2">
                  {c.dateProchaine}
                  {c.statut === 'en_retard' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full">
                      <Clock className="w-3 h-3 mr-1" />
                      En retard
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUT_COLORS[c.statut]}`}>
                    {STATUT_LABELS[c.statut]}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                  Aucune calibration ne correspond à ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
