import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AtterbergGraph({ data }) {
  const chartData = useMemo(() => {
    if (!data) return [];
    
    // Convertir les points de mesure en données pour le graphique
    const points = [];
    if (data.wl_nombre_coups_1 && data.wl_teneur_eau_1) {
      points.push({
        log_n: Math.log10(data.wl_nombre_coups_1),
        teneur_eau: data.wl_teneur_eau_1,
        coups: data.wl_nombre_coups_1
      });
    }
    if (data.wl_nombre_coups_2 && data.wl_teneur_eau_2) {
      points.push({
        log_n: Math.log10(data.wl_nombre_coups_2),
        teneur_eau: data.wl_teneur_eau_2,
        coups: data.wl_nombre_coups_2
      });
    }
    if (data.wl_nombre_coups_3 && data.wl_teneur_eau_3) {
      points.push({
        log_n: Math.log10(data.wl_nombre_coups_3),
        teneur_eau: data.wl_teneur_eau_3,
        coups: data.wl_nombre_coups_3
      });
    }
    
    return points.sort((a, b) => a.log_n - b.log_n);
  }, [data]);

  if (chartData.length === 0) return null;

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Courbe de coulabilité</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="log_n"
            type="number"
            scale="log"
            domain={['auto', 'auto']}
            ticks={[0.5, 0.7, 1, 1.3, 1.7, 2]}
            label={{ value: 'Log(N)', position: 'bottom' }}
          />
          <YAxis
            label={{ value: 'Teneur en eau (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'teneur_eau') return [value.toFixed(1) + '%', 'Teneur en eau'];
              return [value, name];
            }}
            labelFormatter={(value) => `Nombre de coups: ${Math.pow(10, value).toFixed(0)}`}
          />
          <Legend />
          <Line
            type="linear"
            dataKey="teneur_eau"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 6 }}
            name="Teneur en eau"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
