import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function GranulometrieGraph({ data }) {
  const { points_tamisage, d10, d30, d60 } = data || {};

  const chartData = useMemo(() => {
    if (!points_tamisage) return [];
    return points_tamisage
      .filter(point => point.tamis != null && point.pourcentage_passant != null)
      .map(point => ({
        tamis: Math.log10(point.tamis),
        tamis_mm: point.tamis,
        passant: point.pourcentage_passant
      }))
      .sort((a, b) => a.tamis - b.tamis);
  }, [points_tamisage]);

  if (chartData.length === 0) return null;

  const minTamis = Math.min(...chartData.map(d => d.tamis));
  const maxTamis = Math.max(...chartData.map(d => d.tamis));

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Courbe Granulométrique</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="tamis"
            type="number"
            domain={[Math.floor(minTamis - 0.5), Math.ceil(maxTamis + 0.5)]}
            tickFormatter={(value) => Math.pow(10, value).toFixed(3)}
            label={{ value: 'Diamètre des tamis (mm) - échelle log', position: 'bottom' }}
          />
          <YAxis
            domain={[0, 100]}
            label={{ value: 'Passant cumulé (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'passant') return [value.toFixed(1) + '%', 'Passant'];
              if (name === 'tamis_mm') return [value.toFixed(3) + ' mm', 'Tamis'];
              return [value, name];
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="passant"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Courbe granulométrique"
          />
          {d10 && (
            <ReferenceLine
              x={Math.log10(d10)}
              stroke="red"
              label={{ value: 'D10', position: 'top' }}
            />
          )}
          {d30 && (
            <ReferenceLine
              x={Math.log10(d30)}
              stroke="blue"
              label={{ value: 'D30', position: 'top' }}
            />
          )}
          {d60 && (
            <ReferenceLine
              x={Math.log10(d60)}
              stroke="green"
              label={{ value: 'D60', position: 'top' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 text-sm space-y-1">
        <p>D10: {d10?.toFixed(3)} mm</p>
        <p>D30: {d30?.toFixed(3)} mm</p>
        <p>D60: {d60?.toFixed(3)} mm</p>
        {d10 && d60 && <p>Cu = {(d60/d10).toFixed(2)}</p>}
        {d10 && d30 && d60 && <p>Cc = {(Math.pow(d30, 2)/(d10*d60)).toFixed(2)}</p>}
      </div>
    </div>
  );
}
