import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  Activity,
  User,
  Zap,
} from 'lucide-react';
import { fetchAgent, fetchAgentTraces, fetchTeamConversations } from '../api/client';
import StatsCard from '../components/StatsCard';
import TraceViewer from '../components/TraceViewer';
import ConversationList from '../components/ConversationList';
import { cn, formatDate } from '../lib/utils';
import type { Conversation, Trace } from '../types';

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedConvId, setSelectedConvId] = useState<string | undefined>();

  // Fetch agent detail (returns { agent, stats })
  const { data: agentDetail } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => fetchAgent(id!),
    enabled: !!id,
  });

  const agent = agentDetail?.agent;
  const agentStats = agentDetail?.stats;

  // Fetch traces
  const { data: traces } = useQuery<Trace[]>({
    queryKey: ['agentTraces', id],
    queryFn: () => fetchAgentTraces(id!),
    enabled: !!id,
  });

  // Fetch conversations for the agent's team
  const { data: teamConversations } = useQuery({
    queryKey: ['teamConversations', agent?.team_id],
    queryFn: () => fetchTeamConversations(agent!.team_id),
    enabled: !!agent?.team_id,
  });

  // Filter conversations that this agent participated in (via traces)
  const agentConversations = useMemo(() => {
    if (!teamConversations || !traces) return teamConversations ?? [];
    const conversationIds = new Set(traces.map((t) => t.conversation_id));
    if (conversationIds.size === 0) return teamConversations;
    return teamConversations.filter((c) => conversationIds.has(c.id));
  }, [teamConversations, traces]);

  // Filter traces for selected conversation
  const filteredTraces = useMemo(() => {
    if (!traces || !selectedConvId) return traces ?? [];
    return traces.filter((t) => t.conversation_id === selectedConvId);
  }, [traces, selectedConvId]);

  const handleConversationSelect = (conv: Conversation) => {
    setSelectedConvId(conv.id);
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col overflow-hidden">
      {/* Back link */}
      <Link
        to={agent ? `/sessions/${agent.team_id}` : '/'}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        返回会话
      </Link>

      {/* Agent info header */}
      {agent ? (
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gray-800/80 shrink-0">
              <User className="w-7 h-7 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-100">{agent.name}</h1>
                <span
                  className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded',
                    agent.role === 'lead'
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'bg-emerald-500/15 text-emerald-400'
                  )}
                >
                  {agent.role === 'lead' ? '主导' : '协作'}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                    agent.status === 'active' && 'bg-green-500/10 text-green-400',
                    agent.status === 'idle' && 'bg-gray-500/10 text-gray-400',
                    agent.status === 'error' && 'bg-red-500/10 text-red-400'
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      agent.status === 'active' && 'bg-green-500',
                      agent.status === 'idle' && 'bg-gray-500',
                      agent.status === 'error' && 'bg-red-500'
                    )}
                  />
                  {agent.status === 'active' ? '活跃' : agent.status === 'idle' ? '空闲' : '错误'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{agent.specialty}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-2">
                <Clock className="w-3 h-3" />
                创建于 {formatDate(agent.created_at)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6 animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-48 mb-4" />
          <div className="h-4 bg-gray-800 rounded w-64" />
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          icon={MessageSquare}
          label="会话数"
          value={agentStats?.conversation_count ?? (traces ? new Set(traces.map((t) => t.conversation_id)).size : 0)}
          iconColor="text-blue-400"
        />
        <StatsCard
          icon={Activity}
          label="消息数"
          value={agentStats?.message_count ?? 0}
          iconColor="text-cyan-400"
        />
        <StatsCard
          icon={Zap}
          label="平均 Token"
          value={agentStats?.avg_token_usage ? Math.round(agentStats.avg_token_usage).toLocaleString() : '-'}
          iconColor="text-yellow-400"
        />
      </div>

      {/* Conversations + Trace viewer */}
      <div className="flex gap-4 min-h-0 flex-1">
        {/* Conversation list sidebar */}
        <div className="w-64 shrink-0 bg-gray-900/40 border border-gray-800 rounded-lg p-3 overflow-y-auto">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            会话列表
          </h3>
          <ConversationList
            conversations={agentConversations}
            selectedId={selectedConvId}
            onSelect={handleConversationSelect}
          />
        </div>

        {/* Trace viewer */}
        <div className="flex-1 min-w-0">
          <TraceViewer traces={filteredTraces} />
        </div>
      </div>
    </div>
  );
}
