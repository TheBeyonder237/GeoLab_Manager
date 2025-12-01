import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingUp, Download } from 'lucide-react';
import api from '../../services/api';

export default function EssaisAnalysis({ type }) {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
    loadTrends();
  }, [type]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/statistiques/${type}/`);
      setStats(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrends = async () => {
    try {
      const response = await api.get(`/statistiques/${type}/tendances/`);
      setTrends(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des tendances:', error);
    }
  };

  const renderStatCards = () => {
    if (!stats) return null;

    const getStatCards = () => {
      switch (type) {
        case 'proctor':
          return [
            {
              title: 'OPM Moyen',
              value: stats.opm_moyen?.toFixed(1) + '%',
              color: 'blue'
            },
            {
              title: 'Densité sèche max moyenne',
              value: stats.densite_seche_max_moyenne?.toFixed(3) + ' g/cm³',
              color: 'green'
            },
            {
              title: 'Nombre d\'essais',
              value: stats.nombre_essais,
              color: 'purple'
            }
          ];

        case 'cbr':
          return [
            {
              title: 'CBR Moyen',
              value: stats.cbr_moyen?.toFixed(1) + '%',
              color: 'blue'
            },
            {
              title: 'Gonflement Moyen',
              value: stats.gonflement_moyen?.toFixed(2) + ' mm',
              color: 'yellow'
            },
            {
              title: 'Nombre d\'essais',
              value: stats.nombre_essais,
              color: 'purple'
            }
          ];

        // Ajoutez d'autres cas pour les autres types d'essais...

        default:
          return [];
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {getStatCards().map((card, index) => (
          <div
            key={index}
            className={`bg-white rounded-lg shadow p-6 border-t-4 border-${card.color}-500`}
          >
            <h3 className="text-lg font-medium text-gray-900">{card.title}</h3>
            <p className={`text-3xl font-bold text-${card.color}-600 mt-2`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderTrendsGraph = () => {
    if (!trends.length) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Évolution dans le temps</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {renderTrendBars()}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderTrendBars = () => {
    switch (type) {
      case 'proctor':
        return [
          <Bar key="opm" dataKey="opm" name="OPM" fill="#3b82f6" />,
          <Bar key="densite" dataKey="densite_seche_max" name="Densité sèche max" fill="#10b981" />
        ];

      case 'cbr':
        return [
          <Bar key="cbr" dataKey="cbr" name="CBR" fill="#3b82f6" />,
          <Bar key="gonflement" dataKey="gonflement" name="Gonflement" fill="#eab308" />
        ];

      // Ajoutez d'autres cas...

      default:
        return null;
    }
  };

  const exportReport = async () => {
    try {
      const response = await api.get(`/statistiques/${type}/export/`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Analyse statistique - {type.toUpperCase()}
        </h2>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Exporter le rapport
        </button>
      </div>

      {/* Cartes statistiques */}
      {renderStatCards()}

      {/* Graphique des tendances */}
      {renderTrendsGraph()}

      {/* Tableau de distribution */}
      {stats?.distribution && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Distribution</h3>
          </div>
          <div className="px-6 py-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plage
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre d'essais
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pourcentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.distribution.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.range}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(item.percentage * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
