import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare } from 'lucide-react';
import type { TeamWithStats } from '../types';
import { cn, formatRelativeTime } from '../lib/utils';

interface TeamCardProps {
  team: TeamWithStats;
}

export default function TeamCard({ team }: TeamCardProps) {
  const navigate = useNavigate();

  const statusMap: Record<string, string> = { running: '运行中', idle: '空闲', stopped: '已停止' };
  const statusLabel = statusMap[team.status] ?? team.status;

  return (
    <button
      onClick={() => navigate(`/sessions/${team.id}`)}
      className="bg-gray-900/60 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-all duration-200 text-left w-full group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1 mr-3">
          <h3 className="text-base font-semibold text-gray-100 group-hover:text-blue-400 transition-colors truncate">
            {team.name}
          </h3>
          {team.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{team.description}</p>
          )}
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase shrink-0',
            team.status === 'running' && 'bg-green-500/10 text-green-400',
            team.status === 'idle' && 'bg-gray-500/10 text-gray-400',
            team.status === 'stopped' && 'bg-red-500/10 text-red-400'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              team.status === 'running' && 'bg-green-500',
              team.status === 'idle' && 'bg-gray-500',
              team.status === 'stopped' && 'bg-red-500'
            )}
          />
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {team.agent_count} 个智能体
        </span>
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          {team.message_count} 条消息
        </span>
        <span className="ml-auto">{formatRelativeTime(team.created_at)}</span>
      </div>
    </button>
  );
}
