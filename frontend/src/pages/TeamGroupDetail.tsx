import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { ArrowLeft, Users, MessageSquare, Filter } from 'lucide-react';
import { fetchTeamGroup, fetchConversationMessages } from '../api/client';
import MessageBubble from '../components/MessageBubble';
import { cn } from '../lib/utils';
import type { Message } from '../types';

export default function TeamGroupDetail() {
  const { teamName } = useParams<{ teamName: string }>();
  const navigate = useNavigate();
  const [filterAgentSessionId, setFilterAgentSessionId] = useState<string | null>(null);

  // Fetch all teams in this group
  const { data: groupTeams } = useQuery({
    queryKey: ['teamGroup', teamName],
    queryFn: () => fetchTeamGroup(teamName!),
    enabled: !!teamName,
    refetchInterval: 10000,
  });

  // For each team, fetch its conversation messages using useQueries (hook-safe)
  const messagesQueries = useQueries({
    queries: (groupTeams ?? []).map((t) => ({
      queryKey: ['conversationMessages', `${t.id}-conv`],
      queryFn: () => fetchConversationMessages(`${t.id}-conv`),
      refetchInterval: 5000,
    })),
  });

  // Merge all messages with source team info
  const allMessages = useMemo(() => {
    if (!groupTeams) return [];
    const merged: (Message & { sourceTeamName: string; sourceTeamId: string })[] = [];
    for (let i = 0; i < groupTeams.length; i++) {
      const msgs = messagesQueries[i]?.data;
      if (!msgs) continue;
      const teamId = groupTeams[i].id;
      const agentName = groupTeams[i].name;
      for (const msg of msgs) {
        merged.push({
          ...msg,
          sourceTeamName: agentName,
          sourceTeamId: teamId,
        });
      }
    }
    merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return merged;
  }, [groupTeams, messagesQueries]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    if (!filterAgentSessionId) return allMessages;
    return allMessages.filter((m) => m.sourceTeamId === filterAgentSessionId);
  }, [allMessages, filterAgentSessionId]);

  const statusMap: Record<string, string> = { running: '运行中', idle: '空闲', stopped: '已停止' };

  const totalMessages = groupTeams?.reduce((sum, t) => sum + (t.message_count ?? 0), 0) ?? 0;
  const totalAgents = groupTeams?.reduce((sum, t) => sum + (t.agent_count ?? 0), 0) ?? 0;

  return (
    <div className="h-full flex">
      {/* Left column: Team group info + member list (260px) */}
      <div className="w-[260px] shrink-0 border-r border-gray-800 bg-gray-900/30 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            返回总览
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-gray-100 truncate">{teamName}</h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{groupTeams?.length ?? 0} 个成员</span>
            <span>{totalAgents} 个智能体</span>
            <span>{totalMessages} 条消息</span>
          </div>
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 pt-3 pb-2 flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            成员列表
          </h3>
          <div className="space-y-0.5 px-2 pb-2">
            {groupTeams?.map((team) => (
              <div key={team.id} className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/sessions/${team.id}`)}
                  className={cn(
                    'flex-1 text-left px-3 py-2.5 rounded-lg transition-all duration-200',
                    'hover:bg-gray-800/50 border-l-2 border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        team.status === 'running' ? 'bg-green-500' : 'bg-gray-600'
                      )}
                    />
                    <span className="text-sm font-medium text-gray-300 truncate">{team.name}</span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-auto',
                        team.status === 'running'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-gray-500/10 text-gray-500'
                      )}
                    >
                      {statusMap[team.status] ?? team.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-600 pl-3.5">
                    <span>{team.message_count} 条消息</span>
                    <span>{team.agent_count} 个智能体</span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column: Unified mailbox */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with filter */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900/90 border-b border-gray-800 shrink-0">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-gray-200">统一消息视图</span>
          <span className="text-[10px] text-gray-500 ml-1">
            {filteredMessages.length} 条消息
          </span>

          {/* Agent filter */}
          <div className="ml-auto flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={filterAgentSessionId ?? ''}
              onChange={(e) => setFilterAgentSessionId(e.target.value || null)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
            >
              <option value="">全部成员</option>
              {groupTeams?.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              暂无消息
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div key={`${msg.sourceTeamId}-${msg.id}`}>
                {/* Source agent badge */}
                {msg.role === 'agent' && (
                  <div className="flex items-center gap-1.5 ml-1 mb-0.5 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                      {msg.sourceTeamName}
                    </span>
                  </div>
                )}
                <MessageBubble message={msg} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
