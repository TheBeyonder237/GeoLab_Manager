import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter,
  BarChart2,
  PieChart,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react';
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
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function RapportsAvances() {
  const [activeTab, setActiveTab] = useState('statistiques');
  const [filters, setFilters] = useState({
    type_essai: '',
    date_debut: '',
    date_fin: '',
    projet_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    statistiques: null,
    tendances: [],
    distribution: [],
    performance: []
  });
  const [projets, setProjets] = useState([]);

  useEffect(() => {
    loadProjets();
    loadData();
  }, [activeTab, filters]);

  const loadProjets = async () => {
    try {
      const response = await api.get('/projets/?limit=1000');
      setProjets(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type_essai) params.append('type_essai', filters.type_essai);
      if (filters.date_debut) params.append('date_debut', filters.date_debut);
      if (filters.date_fin) params.append('date_fin', filters.date_fin);
      if (filters.projet_id) params.append('projet_id', filters.projet_id);

      const response = await api.get(`/statistiques/${activeTab}?${params.toString()}`);
      setData(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const exportRapport = async (format) => {
    try {
      const params = new URLSearchParams();
      if (filters.type_essai) params.append('type_essai', filters.type_essai);
      if (filters.date_debut) params.append('date_debut', filters.date_debut);
      if (filters.date_fin) params.append('date_fin', filters.date_fin);
      if (filters.projet_id) params.append('projet_id', filters.projet_id);

      const response = await api.get(
        `/statistiques/export/${format}?${params.toString()}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `rapport_${activeTab}_${format}_${new Date().toISOString().split('T')[0]}.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const renderStatistiques = () => {
    if (!data.statistiques) return null;

    const stats = data.statistiques;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <BarChart2 className="w-8 h-8 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Essais
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.nombre_total}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Validés</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.nombre_valides}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Taux de validation</div>
              <div className="text-2xl font-bold text-blue-600">
                {((stats.nombre_valides / stats.nombre_total) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Performance
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-500">Temps moyen de validation</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.temps_moyen_validation} jours
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Taux de conformité</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.taux_conformite}%
              </div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Techniciens
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-500">Nombre de techniciens actifs</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.techniciens_actifs}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Moyenne d'essais par technicien</div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.moyenne_essais_technicien}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTendances = () => {
    if (!data.tendances?.length) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Évolution dans le temps
        </h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.tendances}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM yyyy', { locale: fr })}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) => format(new Date(date), 'PPP', { locale: fr })}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="nombre"
                name="Nombre d'essais"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="valides"
                name="Essais validés"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderDistribution = () => {
    if (!data.distribution?.length) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Distribution par type
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={data.distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {data.distribution.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Distribution par statut
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Nombre d'essais" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Rapports avancés</h2>
          <div className="flex gap-2">
            <button
              onClick={() => exportRapport('pdf')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              PDF
            </button>
            <button
              onClick={() => exportRapport('xlsx')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Excel
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('statistiques')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'statistiques'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Statistiques globales
          </button>
          <button
            onClick={() => setActiveTab('tendances')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'tendances'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tendances
          </button>
          <button
            onClick={() => setActiveTab('distribution')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'distribution'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Distribution
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
            <select
              value={filters.type_essai}
              onChange={(e) => setFilters({ ...filters, type_essai: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les types d'essai</option>
              <option value="atterberg">Limites d'Atterberg</option>
              <option value="proctor">Proctor</option>
              <option value="cbr">CBR</option>
              <option value="granulometrie">Granulométrie</option>
            </select>

            <input
              type="date"
              value={filters.date_debut}
              onChange={(e) => setFilters({ ...filters, date_debut: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              value={filters.date_fin}
              onChange={(e) => setFilters({ ...filters, date_fin: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filters.projet_id}
              onChange={(e) => setFilters({ ...filters, projet_id: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les projets</option>
              {projets.map((projet) => (
                <option key={projet.id} value={projet.id}>
                  {projet.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'statistiques' && renderStatistiques()}
            {activeTab === 'tendances' && renderTendances()}
            {activeTab === 'distribution' && renderDistribution()}
          </>
        )}
      </div>
    </div>
  );
}
