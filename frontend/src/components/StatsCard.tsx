import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  iconColor?: string;
}

export default function StatsCard({ icon: Icon, label, value, trend, iconColor = 'text-blue-400' }: StatsCardProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-100">{value}</p>
        </div>
        <div className={cn('p-2.5 rounded-lg bg-gray-800/50', iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend.direction === 'up' ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className={trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}>
            {trend.value}%
          </span>
          <span className="text-gray-500 ml-1">vs last hour</span>
        </div>
      )}
    </div>
  );
}
