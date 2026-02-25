import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Activity, MessageSquare, Bot } from 'lucide-react';
import { fetchTeams } from '../api/client';
import StatsCard from '../components/StatsCard';
import TeamCard from '../components/TeamCard';
import { cn, formatRelativeTime } from '../lib/utils';
import type { TeamWithStats } from '../types';

interface TeamGroupSummary {
  teamName: string;
  members: TeamWithStats[];
  totalMessages: number;
  totalAgents: number;
  hasRunning: boolean;
  latestCreatedAt: string;
}

export default function Overview() {
  const navigate = useNavigate();
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

  // Group teams by team_name
  const { grouped, ungrouped } = useMemo(() => {
    if (!teams) return { grouped: [] as TeamGroupSummary[], ungrouped: [] as TeamWithStats[] };
    const groups: Record<string, TeamWithStats[]> = {};
    const solo: TeamWithStats[] = [];
    for (const t of teams) {
      if (t.team_name) {
        if (!groups[t.team_name]) groups[t.team_name] = [];
        groups[t.team_name].push(t);
      } else {
        solo.push(t);
      }
    }
    const grouped: TeamGroupSummary[] = Object.entries(groups).map(([teamName, members]) => ({
      teamName,
      members,
      totalMessages: members.reduce((sum, m) => sum + (m.message_count ?? 0), 0),
      totalAgents: members.reduce((sum, m) => sum + (m.agent_count ?? 0), 0),
      hasRunning: members.some((m) => m.status === 'running'),
      latestCreatedAt: members.reduce((latest, m) => (m.created_at > latest ? m.created_at : latest), members[0].created_at),
    }));
    return { grouped, ungrouped: solo };
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
            {/* Team group cards */}
            {grouped.map((group) => (
              <button
                key={`group-${group.teamName}`}
                onClick={() => navigate(`/team-groups/${encodeURIComponent(group.teamName)}`)}
                className="bg-gray-900/60 border border-cyan-800/40 rounded-lg p-5 hover:border-cyan-600/50 transition-all duration-200 text-left w-full group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                      <h3 className="text-base font-semibold text-gray-100 group-hover:text-cyan-400 transition-colors truncate">
                        {group.teamName}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {group.members.length} 个成员会话
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase shrink-0',
                      group.hasRunning
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-gray-500/10 text-gray-400'
                    )}
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        group.hasRunning ? 'bg-green-500' : 'bg-gray-500'
                      )}
                    />
                    {group.hasRunning ? '运行中' : '空闲'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {group.totalAgents} 个智能体
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {group.totalMessages} 条消息
                  </span>
                  <span className="ml-auto">{formatRelativeTime(group.latestCreatedAt)}</span>
                </div>
              </button>
            ))}

            {/* Ungrouped individual team cards */}
            {ungrouped.map((team) => (
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
