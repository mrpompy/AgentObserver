import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconColor?: string;
}

export default function StatsCard({ icon: Icon, label, value, iconColor = 'text-blue-400' }: StatsCardProps) {
  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-100">{value}</p>
        </div>
        <div className={cn('p-2 rounded-lg bg-gray-800/50', iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
