import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Activity, MessageSquare, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchTeams } from '../api/client';
import StatsCard from '../components/StatsCard';
import TeamCard from '../components/TeamCard';
import type { Team } from '../types';

// Generate mock chart data for message volume
function generateChartData() {
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600 * 1000);
    data.push({
      time: `${time.getHours().toString().padStart(2, '0')}:00`,
      messages: Math.floor(Math.random() * 120 + 20),
      traces: Math.floor(Math.random() * 200 + 50),
    });
  }
  return data;
}

export default function Overview() {
  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    refetchInterval: 10000,
  });

  const chartData = useMemo(() => generateChartData(), []);

  const stats = useMemo(() => {
    if (!teams) return { total: 0, running: 0, conversations: 0, messages: 0 };
    return {
      total: teams.length,
      running: teams.filter((t) => t.status === 'running').length,
      conversations: teams.reduce((sum, t) => sum + (t.stats?.conversation_count ?? 0), 0),
      messages: teams.reduce((sum, t) => sum + (t.stats?.message_count ?? 0), 0),
    };
  }, [teams]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor your agent teams in real-time</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="Total Teams"
          value={stats.total}
          iconColor="text-blue-400"
          trend={{ value: 12, direction: 'up' }}
        />
        <StatsCard
          icon={Activity}
          label="Running Teams"
          value={stats.running}
          iconColor="text-green-400"
        />
        <StatsCard
          icon={MessageSquare}
          label="Total Conversations"
          value={stats.conversations}
          iconColor="text-cyan-400"
          trend={{ value: 8, direction: 'up' }}
        />
        <StatsCard
          icon={Zap}
          label="Total Messages"
          value={stats.messages}
          iconColor="text-yellow-400"
          trend={{ value: 24, direction: 'up' }}
        />
      </div>

      {/* Chart */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Message Volume (24h)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTraces" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
            <YAxis stroke="#6b7280" fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Area
              type="monotone"
              dataKey="messages"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorMessages)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="traces"
              stroke="#06b6d4"
              fillOpacity={1}
              fill="url(#colorTraces)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Teams grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Teams</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 animate-pulse h-32" />
            ))}
          </div>
        ) : teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center text-gray-600">
            No teams found. Start a team to begin monitoring.
          </div>
        )}
      </div>
    </div>
  );
}
