import { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Tool, 
  AlertTriangle, 
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

const STATUT_STYLES = {
  planifie: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    icon: Calendar
  },
  en_cours: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    icon: Clock
  },
  termine: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    icon: CheckCircle2
  },
  non_conforme: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    icon: XCircle
  }
};

export default function QualiteCenter() {
  const [activeTab, setActiveTab] = useState('controles');
  const [controles, setControles] = useState([]);
  const [calibrations, setCalibrations] = useState([]);
  const [nonConformites, setNonConformites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    statut: '',
    dateDebut: '',
    dateFin: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'controles':
          await loadControles();
          break;
        case 'calibrations':
          await loadCalibrations();
          break;
        case 'non-conformites':
          await loadNonConformites();
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const loadControles = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.dateDebut) params.append('date_debut', filters.dateDebut);
      if (filters.dateFin) params.append('date_fin', filters.dateFin);

      const response = await api.get(`/qualite/controles?${params.toString()}`);
      setControles(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des contrôles:', error);
      toast.error('Erreur lors du chargement des contrôles');
    }
  };

  const loadCalibrations = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.dateDebut) params.append('date_debut', filters.dateDebut);
      if (filters.dateFin) params.append('date_fin', filters.dateFin);

      const response = await api.get(`/qualite/calibrations?${params.toString()}`);
      setCalibrations(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des calibrations:', error);
      toast.error('Erreur lors du chargement des calibrations');
    }
  };

  const loadNonConformites = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.statut !== undefined) params.append('statut', filters.statut);

      const response = await api.get(`/qualite/non-conformites?${params.toString()}`);
      setNonConformites(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des non-conformités:', error);
      toast.error('Erreur lors du chargement des non-conformités');
    }
  };

  const renderControles = () => (
    <div className="space-y-4">
      {controles.map((controle) => {
        const { bg, text, icon: StatusIcon } = STATUT_STYLES[controle.statut];
        return (
          <div
            key={controle.id}
            className={`p-4 rounded-lg border ${bg}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <StatusIcon className={`w-5 h-5 ${text}`} />
                  <h3 className="font-medium text-gray-900">{controle.titre}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{controle.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    Prévu le: {format(new Date(controle.date_prevue), 'PPP', { locale: fr })}
                  </span>
                  <span>
                    Responsable: {controle.responsable.full_name || controle.responsable.username}
                  </span>
                </div>
              </div>
              {controle.statut === 'planifie' && (
                <button
                  onClick={() => handleStartControle(controle.id)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Démarrer
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCalibrations = () => (
    <div className="space-y-4">
      {calibrations.map((calibration) => (
        <div
          key={calibration.id}
          className={`p-4 rounded-lg border ${
            calibration.conforme ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {calibration.conforme ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <h3 className="font-medium text-gray-900">
                  {calibration.equipement} - {calibration.numero_serie}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                <div>
                  <span className="font-medium">Précision:</span>{' '}
                  {calibration.precision?.toFixed(3)}
                </div>
                <div>
                  <span className="font-medium">Prochaine calibration:</span>{' '}
                  {format(new Date(calibration.date_prochaine), 'PPP', { locale: fr })}
                </div>
              </div>
              {calibration.commentaires && (
                <p className="text-sm text-gray-600 mt-2">{calibration.commentaires}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderNonConformites = () => (
    <div className="space-y-4">
      {nonConformites.map((nc) => (
        <div
          key={nc.id}
          className={`p-4 rounded-lg border ${
            nc.date_resolution ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {nc.date_resolution ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <h3 className="font-medium text-gray-900">{nc.titre}</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  nc.gravite >= 4 ? 'bg-red-100 text-red-800' :
                  nc.gravite >= 3 ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  Gravité {nc.gravite}/5
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{nc.description}</p>
              {nc.action_corrective && (
                <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                  <span className="text-sm font-medium">Action corrective:</span>
                  <p className="text-sm text-gray-600 mt-1">{nc.action_corrective}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Centre Qualité</h2>
          <button
            onClick={() => {/* TODO: Ouvrir modal de création */}}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau contrôle
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('controles')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'controles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Contrôles
          </button>
          <button
            onClick={() => setActiveTab('calibrations')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'calibrations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Calibrations
          </button>
          <button
            onClick={() => setActiveTab('non-conformites')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'non-conformites'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Non-conformités
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
            {activeTab !== 'calibrations' && (
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les types</option>
                {activeTab === 'controles' ? (
                  <>
                    <option value="verification_donnees">Vérification des données</option>
                    <option value="calibration">Calibration</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="audit">Audit</option>
                    <option value="formation">Formation</option>
                  </>
                ) : (
                  <>
                    <option value="materiel">Matériel</option>
                    <option value="methode">Méthode</option>
                    <option value="personnel">Personnel</option>
                    <option value="environnement">Environnement</option>
                  </>
                )}
              </select>
            )}
            {activeTab !== 'non-conformites' && (
              <>
                <input
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={filters.dateFin}
                  onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </>
            )}
            {activeTab === 'controles' && (
              <select
                value={filters.statut}
                onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="non_conforme">Non conforme</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'controles' && renderControles()}
            {activeTab === 'calibrations' && renderCalibrations()}
            {activeTab === 'non-conformites' && renderNonConformites()}
          </>
        )}
      </div>
    </div>
  );
}
