import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';

export default function ProctorGraph({ data }) {
  const { points_mesure, opm, densite_seche_max } = data || {};

  const chartData = useMemo(() => {
    if (!points_mesure) return [];
    return points_mesure
      .filter(point => point.teneur_eau != null && point.densite_seche != null)
      .map(point => ({
        teneur_eau: point.teneur_eau,
        densite_seche: point.densite_seche
      }))
      .sort((a, b) => a.teneur_eau - b.teneur_eau);
  }, [points_mesure]);

  if (chartData.length === 0) return null;

  const minTeneur = Math.min(...chartData.map(d => d.teneur_eau));
  const maxTeneur = Math.max(...chartData.map(d => d.teneur_eau));
  const minDensite = Math.min(...chartData.map(d => d.densite_seche));
  const maxDensite = Math.max(...chartData.map(d => d.densite_seche));

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Courbe Proctor</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="teneur_eau"
            type="number"
            domain={[Math.floor(minTeneur - 2), Math.ceil(maxTeneur + 2)]}
            label={{ value: 'Teneur en eau (%)', position: 'bottom' }}
          />
          <YAxis
            domain={[Math.floor(minDensite * 10) / 10, Math.ceil(maxDensite * 10) / 10]}
            label={{ value: 'Densité sèche (g/cm³)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'densite_seche') return [value.toFixed(3) + ' g/cm³', 'Densité sèche'];
              return [value.toFixed(1) + '%', 'Teneur en eau'];
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="densite_seche"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 6 }}
            name="Points de mesure"
          />
          {opm && densite_seche_max && (
            <ReferenceDot
              x={opm}
              y={densite_seche_max}
              r={8}
              fill="red"
              stroke="none"
              label={{
                value: 'OPM',
                position: 'top',
                fill: 'red',
                fontSize: 12
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {opm && densite_seche_max && (
        <div className="mt-4 text-sm text-gray-600">
          <p>OPM: {opm.toFixed(1)}% - Densité sèche max: {densite_seche_max.toFixed(3)} g/cm³</p>
        </div>
      )}
    </div>
  );
}
