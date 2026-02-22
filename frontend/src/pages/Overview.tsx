import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Activity, MessageSquare, Bot } from 'lucide-react';
import { fetchTeams } from '../api/client';
import StatsCard from '../components/StatsCard';
import TeamCard from '../components/TeamCard';
import type { TeamWithStats } from '../types';

export default function Overview() {
  const { data: teams, isLoading } = useQuery<TeamWithStats[]>({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    refetchInterval: 10000,
  });

  const stats = useMemo(() => {
    if (!teams) return { totalSessions: 0, activeSessions: 0, totalMessages: 0, totalAgents: 0 };
    return {
      totalSessions: teams.length,
      activeSessions: teams.filter((t) => t.status === 'running').length,
      totalMessages: teams.reduce((sum, t) => sum + (t.message_count ?? 0), 0),
      totalAgents: teams.reduce((sum, t) => sum + (t.agent_count ?? 0), 0),
    };
  }, [teams]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">总览</h1>
        <p className="text-sm text-gray-500 mt-1">实时监控智能体会话</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="总会话数"
          value={stats.totalSessions}
          iconColor="text-blue-400"
        />
        <StatsCard
          icon={Activity}
          label="活跃会话"
          value={stats.activeSessions}
          iconColor="text-green-400"
        />
        <StatsCard
          icon={MessageSquare}
          label="总消息数"
          value={stats.totalMessages}
          iconColor="text-cyan-400"
        />
        <StatsCard
          icon={Bot}
          label="智能体数"
          value={stats.totalAgents}
          iconColor="text-yellow-400"
        />
      </div>

      {/* Sessions grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">会话记录</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-lg p-5 animate-pulse h-32" />
            ))}
          </div>
        ) : teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-12 text-center text-gray-600">
            暂无会话。启动一个 Team 开始监控。
          </div>
        )}
      </div>
    </div>
  );
}
