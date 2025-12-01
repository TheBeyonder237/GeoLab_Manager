import { useState, useEffect } from 'react';
import { 
  Shield,
  AlertTriangle,
  Tool,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  BarChart2,
  FileText,
  Filter,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function QualityDashboard() {
  const [activeTab, setActiveTab] = useState('apercu');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [controles, setControles] = useState([]);
  const [calibrations, setCalibrations] = useState([]);
  const [nonConformites, setNonConformites] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    periode: '30',  // 7, 30, 90, 365
    type: '',
    statut: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les statistiques globales
      const statsResponse = await api.get('/qualite/statistiques', {
        params: { periode: filters.periode }
      });
      setStats(statsResponse.data);

      // Charger les contrôles qualité
      const controlesResponse = await api.get('/qualite/controles/', {
        params: {
          ...filters,
          limit: 5,
          order_by: 'date_prevue'
        }
      });
      setControles(controlesResponse.data);

      // Charger les calibrations
      const calibrationsResponse = await api.get('/qualite/calibrations/', {
        params: {
          ...filters,
          limit: 5,
          order_by: 'date_prochaine'
        }
      });
      setCalibrations(calibrationsResponse.data);

      // Charger les non-conformités
      const ncResponse = await api.get('/qualite/non-conformites/', {
        params: {
          ...filters,
          limit: 5,
          order_by: '-created_at'
        }
      });
      setNonConformites(ncResponse.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = ({ title, value, description, icon: Icon, color, trend }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${
      trend > 0 ? 'hover:border-green-300' : 
      trend < 0 ? 'hover:border-red-300' : 
      'hover:border-gray-300'
    } transition-colors`}>
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          trend > 0 ? 'bg-green-100 text-green-800' :
          trend < 0 ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-1">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {description && (
          <span className="text-sm text-gray-500">{description}</span>
        )}
      </div>
    </div>
  );

  const renderApercu = () => (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderStatCard({
          title: "Taux de conformité",
          value: `${stats?.taux_conformite}%`,
          description: "sur 30 jours",
          icon: CheckCircle2,
          color: "green",
          trend: stats?.tendance_conformite
        })}
        {renderStatCard({
          title: "Non-conformités",
          value: stats?.nombre_nc || 0,
          description: "non résolues",
          icon: AlertTriangle,
          color: "red",
          trend: stats?.tendance_nc
        })}
        {renderStatCard({
          title: "Calibrations",
          value: stats?.calibrations_a_faire || 0,
          description: "à effectuer",
          icon: Tool,
          color: "blue",
          trend: 0
        })}
        {renderStatCard({
          title: "Contrôles",
          value: stats?.controles_planifies || 0,
          description: "planifiés",
          icon: Calendar,
          color: "purple",
          trend: stats?.tendance_controles
        })}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendances des non-conformités */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tendance des non-conformités
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.tendances_nc || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'dd/MM')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), 'dd MMMM yyyy', { locale: fr })}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="nombre"
                  name="Non-conformités"
                  stroke="#ef4444"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution des non-conformités */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribution par type
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.distribution_nc || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {(stats?.distribution_nc || []).map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Listes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Non-conformités récentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Non-conformités récentes
            </h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Voir tout
            </button>
          </div>
          <div className="space-y-4">
            {nonConformites.map((nc) => (
              <div
                key={nc.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <div className={`p-2 rounded-lg ${
                  nc.gravite >= 4 ? 'bg-red-100' :
                  nc.gravite >= 3 ? 'bg-orange-100' :
                  'bg-yellow-100'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    nc.gravite >= 4 ? 'text-red-600' :
                    nc.gravite >= 3 ? 'text-orange-600' :
                    'text-yellow-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{nc.titre}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2">{nc.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{format(new Date(nc.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                    <span>Gravité: {nc.gravite}/5</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calibrations à venir */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Calibrations à venir
            </h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Voir tout
            </button>
          </div>
          <div className="space-y-4">
            {calibrations.map((cal) => (
              <div
                key={cal.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <div className="p-2 rounded-lg bg-blue-100">
                  <Tool className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{cal.equipement}</h4>
                  <p className="text-sm text-gray-500">N° série: {cal.numero_serie}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-gray-500">
                      Prochaine: {format(new Date(cal.date_prochaine), 'dd MMM yyyy', { locale: fr })}
                    </span>
                    {new Date(cal.date_prochaine) <= new Date() ? (
                      <span className="text-red-600 font-medium">En retard</span>
                    ) : (
                      <span className="text-green-600 font-medium">À jour</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8" />
              Contrôle Qualité
            </h1>
            <p className="text-gray-600 mt-1">
              Tableau de bord qualité et suivi des non-conformités
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filtres
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => {/* TODO: Ouvrir modal nouvelle NC */}}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nouvelle NC
            </button>
          </div>
        </div>

        {/* Filtres */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <select
              value={filters.periode}
              onChange={(e) => setFilters({ ...filters, periode: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
              <option value="365">12 derniers mois</option>
            </select>
            
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les types</option>
              <option value="materiel">Matériel</option>
              <option value="methode">Méthode</option>
              <option value="personnel">Personnel</option>
              <option value="environnement">Environnement</option>
            </select>
            
            <select
              value={filters.statut}
              onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="ouvert">Ouvert</option>
              <option value="en_cours">En cours</option>
              <option value="resolu">Résolu</option>
            </select>
          </div>
        )}
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('apercu')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'apercu'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Aperçu
              </button>
              <button
                onClick={() => setActiveTab('non-conformites')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'non-conformites'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Non-conformités
              </button>
              <button
                onClick={() => setActiveTab('controles')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'controles'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contrôles
              </button>
              <button
                onClick={() => setActiveTab('calibrations')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'calibrations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Calibrations
              </button>
              <button
                onClick={() => setActiveTab('rapports')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'rapports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Rapports
              </button>
            </div>
          </div>

          {/* Contenu de l'onglet */}
          {activeTab === 'apercu' && renderApercu()}
          {/* TODO: Ajouter les autres onglets */}
        </div>
      )}
    </div>
  );
}
