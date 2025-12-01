import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  trend = null,
  trendValue = null,
  trendPeriod = null,
  color = 'blue',
  loading = false,
  onClick
}) {
  const colors = {
    blue: {
      light: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    green: {
      light: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-600',
      iconBg: 'bg-green-100',
    },
    yellow: {
      light: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
    },
    red: {
      light: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-600',
      iconBg: 'bg-red-100',
    },
    purple: {
      light: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-600',
      iconBg: 'bg-purple-100',
    },
    gray: {
      light: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-600',
      iconBg: 'bg-gray-100',
    }
  };

  const renderTrendIcon = () => {
    if (trend === 'up') {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (trend === 'down') {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const renderTrendText = () => {
    if (trendValue === null) return null;

    let trendClass = 'text-gray-500';
    if (trend === 'up') trendClass = 'text-green-600';
    if (trend === 'down') trendClass = 'text-red-600';

    return (
      <span className={`text-sm ${trendClass}`}>
        {trendValue > 0 ? '+' : ''}{trendValue}%
        {trendPeriod && <span className="text-gray-500"> vs {trendPeriod}</span>}
      </span>
    );
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg border ${colors[color].border} ${
        onClick ? 'cursor-pointer transform transition hover:scale-102 hover:shadow-md' : ''
      }`}
      onClick={onClick}
    >
      <div className={`p-6 ${colors[color].light}`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${colors[color].iconBg}`}>
            <Icon className={`w-6 h-6 ${colors[color].text}`} />
          </div>
          {trend !== null && (
            <div className="flex items-center gap-1">
              {renderTrendIcon()}
              {renderTrendText()}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="flex items-baseline">
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <>
                <span className={`text-2xl font-bold ${colors[color].text}`}>
                  {value}
                </span>
                {unit && (
                  <span className="ml-1 text-sm text-gray-500">{unit}</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Decorative corner shapes */}
        <div className="absolute top-0 right-0 -mt-3 -mr-3 w-20 h-20 transform rotate-45 bg-white opacity-10"></div>
        <div className="absolute bottom-0 left-0 -mb-3 -ml-3 w-20 h-20 transform rotate-45 bg-white opacity-10"></div>
      </div>
    </div>
  );
}
