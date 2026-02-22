import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Circle } from 'lucide-react';
import type { Team } from '../types';
import { cn, getStatusTextColor, formatRelativeTime } from '../lib/utils';

interface TeamCardProps {
  team: Team;
}

export default function TeamCard({ team }: TeamCardProps) {
  const navigate = useNavigate();

  const statusLabel = team.status.charAt(0).toUpperCase() + team.status.slice(1);

  return (
    <button
      onClick={() => navigate(`/teams/${team.id}`)}
      className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-5 hover:border-blue-500/50 hover:bg-gray-900/70 transition-all duration-200 text-left w-full group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-100 group-hover:text-blue-400 transition-colors">
            {team.name}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{team.description}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            team.status === 'running' && 'bg-green-500/10 text-green-400',
            team.status === 'idle' && 'bg-gray-500/10 text-gray-400',
            team.status === 'stopped' && 'bg-red-500/10 text-red-400'
          )}
        >
          <Circle className={cn('w-1.5 h-1.5 fill-current', getStatusTextColor(team.status))} />
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {team.stats?.agent_count ?? 0} agents
        </span>
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          {team.stats?.message_count ?? 0} messages
        </span>
        <span className="ml-auto">{formatRelativeTime(team.created_at)}</span>
      </div>
    </button>
  );
}
