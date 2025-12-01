import { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  Label,
  ReferenceLine
} from 'recharts';
import { Download, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import html2canvas from 'html2canvas';

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316'  // orange
];

const CHART_TYPES = {
  line: {
    component: LineChart,
    elementComponent: Line,
    defaultProps: { type: 'monotone', strokeWidth: 2 }
  },
  bar: {
    component: BarChart,
    elementComponent: Bar,
    defaultProps: {}
  },
  area: {
    component: AreaChart,
    elementComponent: Area,
    defaultProps: { type: 'monotone', strokeWidth: 2, fillOpacity: 0.3 }
  }
};

export default function InteractiveChart({
  data,
  series,
  xAxis,
  yAxis,
  type = 'line',
  height = 400,
  brush = false,
  zoom = false,
  grid = true,
  animation = true,
  referenceLines = [],
  tooltipFormatter,
  xAxisFormatter,
  yAxisFormatter,
  theme = 'light'
}) {
  const [zoomDomain, setZoomDomain] = useState(null);
  const [isZooming, setIsZooming] = useState(false);
  const chartRef = useRef(null);

  const ChartComponent = CHART_TYPES[type].component;
  const DataComponent = CHART_TYPES[type].elementComponent;
  const defaultProps = CHART_TYPES[type].defaultProps;

  // Thèmes de couleurs
  const themes = {
    light: {
      background: 'white',
      text: '#374151',
      grid: '#E5E7EB',
      tooltip: {
        background: 'white',
        border: '#D1D5DB'
      }
    },
    dark: {
      background: '#1F2937',
      text: '#D1D5DB',
      grid: '#374151',
      tooltip: {
        background: '#374151',
        border: '#4B5563'
      }
    }
  };

  const currentTheme = themes[theme];

  const handleZoom = (direction) => {
    if (!zoomDomain) {
      const xValues = data.map(d => d[xAxis.dataKey]);
      const min = Math.min(...xValues);
      const max = Math.max(...xValues);
      const range = max - min;
      const center = min + range / 2;
      
      if (direction === 'in') {
        setZoomDomain([
          center - range / 4,
          center + range / 4
        ]);
      }
    } else {
      if (direction === 'out') {
        setZoomDomain(null);
      } else {
        const [min, max] = zoomDomain;
        const range = max - min;
        const center = min + range / 2;
        setZoomDomain([
          center - range / 4,
          center + range / 4
        ]);
      }
    }
  };

  const handleReset = () => {
    setZoomDomain(null);
    setIsZooming(false);
  };

  const exportChart = async () => {
    try {
      const canvas = await html2canvas(chartRef.current);
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `chart-${new Date().toISOString()}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  const renderTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className={`p-3 rounded-lg shadow-lg border ${
        theme === 'light'
          ? 'bg-white border-gray-200'
          : 'bg-gray-800 border-gray-700'
      }`}>
        <div className={`font-medium mb-1 ${
          theme === 'light' ? 'text-gray-900' : 'text-gray-100'
        }`}>
          {tooltipFormatter
            ? tooltipFormatter(label)
            : xAxisFormatter
            ? xAxisFormatter(label)
            : label}
        </div>
        {payload.map((entry, index) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className={
                theme === 'light' ? 'text-gray-600' : 'text-gray-300'
              }>
                {series.find(s => s.dataKey === entry.dataKey)?.name || entry.dataKey}
              </span>
            </div>
            <span className={
              theme === 'light' ? 'text-gray-900' : 'text-gray-100'
            }>
              {yAxisFormatter ? yAxisFormatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`rounded-lg border ${
      theme === 'light'
        ? 'bg-white border-gray-200'
        : 'bg-gray-800 border-gray-700'
    }`}>
      {/* Toolbar */}
      <div className={`px-4 py-2 border-b flex items-center justify-between ${
        theme === 'light'
          ? 'border-gray-200'
          : 'border-gray-700'
      }`}>
        {zoom && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleZoom('in')}
              className={`p-1.5 rounded-lg ${
                theme === 'light'
                  ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  : 'hover:bg-gray-700 text-gray-400 hover:text-gray-100'
              }`}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleZoom('out')}
              disabled={!zoomDomain}
              className={`p-1.5 rounded-lg disabled:opacity-50 ${
                theme === 'light'
                  ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  : 'hover:bg-gray-700 text-gray-400 hover:text-gray-100'
              }`}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleReset}
              className={`p-1.5 rounded-lg ${
                theme === 'light'
                  ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  : 'hover:bg-gray-700 text-gray-400 hover:text-gray-100'
              }`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}
        <button
          onClick={exportChart}
          className={`p-1.5 rounded-lg ${
            theme === 'light'
              ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              : 'hover:bg-gray-700 text-gray-400 hover:text-gray-100'
          }`}
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {grid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={currentTheme.grid}
              />
            )}
            
            <XAxis
              dataKey={xAxis.dataKey}
              type={xAxis.type || "category"}
              domain={zoomDomain || xAxis.domain}
              tickFormatter={xAxisFormatter}
              stroke={currentTheme.text}
            >
              {xAxis.label && (
                <Label
                  value={xAxis.label}
                  position="bottom"
                  style={{ fill: currentTheme.text }}
                />
              )}
            </XAxis>
            
            <YAxis
              {...yAxis}
              tickFormatter={yAxisFormatter}
              stroke={currentTheme.text}
            >
              {yAxis.label && (
                <Label
                  value={yAxis.label}
                  angle={-90}
                  position="left"
                  style={{ fill: currentTheme.text }}
                />
              )}
            </YAxis>
            
            <Tooltip
              content={renderTooltip}
              cursor={{ stroke: currentTheme.grid }}
            />
            
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                color: currentTheme.text
              }}
            />
            
            {series.map((s, index) => (
              <DataComponent
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color || CHART_COLORS[index % CHART_COLORS.length]}
                fill={s.color || CHART_COLORS[index % CHART_COLORS.length]}
                {...defaultProps}
                {...s}
                isAnimationActive={animation}
              />
            ))}

            {referenceLines.map((line, index) => (
              <ReferenceLine
                key={index}
                {...line}
                stroke={line.color || '#CBD5E1'}
              />
            ))}

            {brush && (
              <Brush
                dataKey={xAxis.dataKey}
                height={30}
                stroke={CHART_COLORS[0]}
                fill={currentTheme.background}
                tickFormatter={xAxisFormatter}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
