import { useState, useEffect } from 'react';
import { BarChart2, LineChart, PieChart, Settings, Plus, Trash2 } from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  Line,
  Bar,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const CHART_TYPES = {
  line: {
    name: 'Ligne',
    icon: LineChart,
    component: RechartsLineChart,
    dataComponent: Line
  },
  bar: {
    name: 'Barres',
    icon: BarChart2,
    component: RechartsBarChart,
    dataComponent: Bar
  },
  pie: {
    name: 'Camembert',
    icon: PieChart,
    component: RechartsPieChart,
    dataComponent: Pie
  }
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ChartEditor({ data, onChange }) {
  const [chartType, setChartType] = useState(data.type || 'line');
  const [chartData, setChartData] = useState(data.data || []);
  const [showSettings, setShowSettings] = useState(false);
  const [options, setOptions] = useState(data.options || {
    title: '',
    xAxis: { label: '', key: 'x' },
    yAxis: { label: '', key: 'y' },
    showGrid: true,
    showLegend: true
  });

  const updateChart = (newData) => {
    onChange({
      type: chartType,
      data: newData,
      options
    });
  };

  const addDataPoint = () => {
    const newPoint = {
      x: '',
      y: '',
      label: `Point ${chartData.length + 1}`
    };
    const newData = [...chartData, newPoint];
    setChartData(newData);
    updateChart(newData);
  };

  const updateDataPoint = (index, field, value) => {
    const newData = chartData.map((point, i) =>
      i === index ? { ...point, [field]: value } : point
    );
    setChartData(newData);
    updateChart(newData);
  };

  const removeDataPoint = (index) => {
    const newData = chartData.filter((_, i) => i !== index);
    setChartData(newData);
    updateChart(newData);
  };

  const updateOptions = (newOptions) => {
    setOptions(newOptions);
    onChange({
      type: chartType,
      data: chartData,
      options: newOptions
    });
  };

  const renderChart = () => {
    const ChartComponent = CHART_TYPES[chartType].component;
    const DataComponent = CHART_TYPES[chartType].dataComponent;

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent>
            <Pie
              data={chartData}
              dataKey="y"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            {options.showLegend && <Legend />}
            <Tooltip />
          </ChartComponent>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={chartData}>
          {options.showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis
            dataKey="x"
            label={{ value: options.xAxis.label, position: 'bottom' }}
          />
          <YAxis
            label={{ value: options.yAxis.label, angle: -90, position: 'left' }}
          />
          <Tooltip />
          {options.showLegend && <Legend />}
          <DataComponent
            type="monotone"
            dataKey="y"
            stroke={COLORS[0]}
            fill={chartType === 'bar' ? COLORS[0] : undefined}
          />
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      {/* Type de graphique */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          {Object.entries(CHART_TYPES).map(([type, { name, icon: Icon }]) => (
            <button
              key={type}
              onClick={() => {
                setChartType(type);
                updateChart(chartData);
              }}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 ${
                chartType === type
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{name}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Paramètres */}
      {showSettings && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre
            </label>
            <input
              type="text"
              value={options.title}
              onChange={(e) => updateOptions({ ...options, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {chartType !== 'pie' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label axe X
                </label>
                <input
                  type="text"
                  value={options.xAxis.label}
                  onChange={(e) => updateOptions({
                    ...options,
                    xAxis: { ...options.xAxis, label: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label axe Y
                </label>
                <input
                  type="text"
                  value={options.yAxis.label}
                  onChange={(e) => updateOptions({
                    ...options,
                    yAxis: { ...options.yAxis, label: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.showGrid}
                onChange={(e) => updateOptions({ ...options, showGrid: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Afficher la grille</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.showLegend}
                onChange={(e) => updateOptions({ ...options, showLegend: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Afficher la légende</span>
            </label>
          </div>
        </div>
      )}

      {/* Aperçu */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {chartData.length > 0 ? (
          renderChart()
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            Ajoutez des données pour voir le graphique
          </div>
        )}
      </div>

      {/* Données */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Données</h3>
          <button
            onClick={addDataPoint}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Ajouter un point
          </button>
        </div>

        <div className="space-y-2">
          {chartData.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={point.label}
                onChange={(e) => updateDataPoint(index, 'label', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Label"
              />
              {chartType !== 'pie' && (
                <input
                  type="text"
                  value={point.x}
                  onChange={(e) => updateDataPoint(index, 'x', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Valeur X"
                />
              )}
              <input
                type="text"
                value={point.y}
                onChange={(e) => updateDataPoint(index, 'y', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Valeur Y"
              />
              <button
                onClick={() => removeDataPoint(index)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
