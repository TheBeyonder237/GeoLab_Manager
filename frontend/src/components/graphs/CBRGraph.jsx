import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';

export default function CBRGraph({ data }) {
  const { points_penetration, force_25mm, force_50mm } = data || {};

  const chartData = useMemo(() => {
    if (!points_penetration) return [];
    return points_penetration
      .filter(point => point.penetration_mm != null && point.force_kN != null)
      .map(point => ({
        penetration: point.penetration_mm,
        force: point.force_kN
      }))
      .sort((a, b) => a.penetration - b.penetration);
  }, [points_penetration]);

  if (chartData.length === 0) return null;

  const maxForce = Math.max(...chartData.map(d => d.force));
  const maxPenetration = Math.max(...chartData.map(d => d.penetration));

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Courbe CBR</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="penetration"
            type="number"
            domain={[0, Math.ceil(maxPenetration + 1)]}
            label={{ value: 'Pénétration (mm)', position: 'bottom' }}
          />
          <YAxis
            domain={[0, Math.ceil(maxForce + 2)]}
            label={{ value: 'Force (kN)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'force') return [value.toFixed(2) + ' kN', 'Force'];
              return [value.toFixed(2) + ' mm', 'Pénétration'];
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="force"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Force/Pénétration"
          />
          {force_25mm && (
            <ReferenceDot
              x={2.5}
              y={force_25mm}
              r={6}
              fill="red"
              stroke="none"
              label={{ value: '2.5mm', position: 'top' }}
            />
          )}
          {force_50mm && (
            <ReferenceDot
              x={5.0}
              y={force_50mm}
              r={6}
              fill="blue"
              stroke="none"
              label={{ value: '5.0mm', position: 'top' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 text-sm text-gray-600">
        <p>Force à 2.5mm: {force_25mm?.toFixed(2)} kN - Force à 5.0mm: {force_50mm?.toFixed(2)} kN</p>
      </div>
    </div>
  );
}
