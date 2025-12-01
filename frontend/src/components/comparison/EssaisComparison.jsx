import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Filter, Table } from 'lucide-react';
import api from '../../services/api';

export default function EssaisComparison({ type }) {
  const [essais, setEssais] = useState([]);
  const [selectedEssais, setSelectedEssais] = useState([]);
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    projet: '',
    operateur: ''
  });

  useEffect(() => {
    loadEssais();
  }, [type]);

  const loadEssais = async () => {
    try {
      const response = await api.get(`/essais/?type_essai=${type}&limit=1000`);
      setEssais(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des essais:', error);
    }
  };

  const getGraphData = () => {
    switch (type) {
      case 'proctor':
        return selectedEssais.map(essai => ({
          id: essai.id,
          points: essai.proctor?.points_mesure?.map(p => ({
            teneur_eau: p.teneur_eau,
            densite_seche: p.densite_seche,
            essai_id: essai.id,
            numero_essai: essai.numero_essai
          })) || [],
          opm: essai.proctor?.opm,
          densite_seche_max: essai.proctor?.densite_seche_max
        }));

      case 'granulometrie':
        return selectedEssais.map(essai => ({
          id: essai.id,
          points: essai.granulometrie?.points_tamisage?.map(p => ({
            tamis: parseFloat(p.tamis.replace('mm', '')),
            passant: p.pourcentage_passant,
            essai_id: essai.id,
            numero_essai: essai.numero_essai
          })) || []
        }));

      case 'cbr':
        return selectedEssais.map(essai => ({
          id: essai.id,
          points: essai.cbr?.points_penetration?.map(p => ({
            penetration: p.penetration_mm,
            force: p.force_kN,
            essai_id: essai.id,
            numero_essai: essai.numero_essai
          })) || []
        }));

      case 'atterberg':
        return selectedEssais.map(essai => ({
          id: essai.id,
          points: [
            {
              wl: essai.atterberg?.wl,
              wp: essai.atterberg?.wp,
              ip: essai.atterberg?.ip,
              essai_id: essai.id,
              numero_essai: essai.numero_essai
            }
          ]
        }));

      default:
        return [];
    }
  };

  const exportToExcel = () => {
    // Implémentation de l'export Excel
  };

  const exportToPDF = () => {
    // Implémentation de l'export PDF
  };

  const renderComparisonGraph = () => {
    const data = getGraphData();
    if (!data.length) return null;

    switch (type) {
      case 'proctor':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="teneur_eau"
                type="number"
                label={{ value: 'Teneur en eau (%)', position: 'bottom' }}
              />
              <YAxis
                label={{ value: 'Densité sèche (g/cm³)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              {data.map((essai, index) => (
                <Line
                  key={essai.id}
                  data={essai.points}
                  type="monotone"
                  dataKey="densite_seche"
                  name={`Essai ${essai.points[0]?.numero_essai}`}
                  stroke={`hsl(${index * 360 / data.length}, 70%, 50%)`}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'granulometrie':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="tamis"
                type="number"
                scale="log"
                domain={[0.01, 100]}
                label={{ value: 'Diamètre (mm)', position: 'bottom' }}
              />
              <YAxis
                domain={[0, 100]}
                label={{ value: 'Passant (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              {data.map((essai, index) => (
                <Line
                  key={essai.id}
                  data={essai.points}
                  type="monotone"
                  dataKey="passant"
                  name={`Essai ${essai.points[0]?.numero_essai}`}
                  stroke={`hsl(${index * 360 / data.length}, 70%, 50%)`}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      // Ajoutez d'autres cas pour CBR et Atterberg...
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Filtres</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date début</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.dateDebut}
              onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date fin</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.dateFin}
              onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Projet</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.projet}
              onChange={(e) => setFilters({ ...filters, projet: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Opérateur</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.operateur}
              onChange={(e) => setFilters({ ...filters, operateur: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Sélection des essais */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Table className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold">Essais disponibles</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Export Excel
            </button>
            <button
              onClick={exportToPDF}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Export PDF
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {essais.map(essai => (
            <div
              key={essai.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedEssais.find(e => e.id === essai.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => {
                if (selectedEssais.find(e => e.id === essai.id)) {
                  setSelectedEssais(selectedEssais.filter(e => e.id !== essai.id));
                } else {
                  setSelectedEssais([...selectedEssais, essai]);
                }
              }}
            >
              <h4 className="font-medium">{essai.numero_essai}</h4>
              <div className="text-sm text-gray-500">
                <p>Projet: {essai.projet_nom || 'N/A'}</p>
                <p>Date: {new Date(essai.date_essai).toLocaleDateString()}</p>
                <p>Opérateur: {essai.operateur?.username || 'N/A'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graphique de comparaison */}
      {selectedEssais.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Comparaison des essais</h3>
          {renderComparisonGraph()}
        </div>
      )}
    </div>
  );
}
