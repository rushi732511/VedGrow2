import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number | null;
    label: string;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

const colorClasses = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600' },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs mt-2 font-medium ${
              trend.value === null
                ? 'text-gray-400'
                : trend.value >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {trend.value === null
                ? '— ' + trend.label
                : `${trend.value >= 0 ? '↑' : '↓'} ${Math.abs(trend.value)}% ${trend.label}`
              }
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors.icon}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}