import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, MessageSquare, Inbox } from 'lucide-react';
import { fetchTeam, fetchTeamAgents, fetchTeamConversations, fetchConversationMessages } from '../api/client';
import AgentPane from '../components/AgentPane';
import AgentListItem from '../components/AgentListItem';
import MessageBubble from '../components/MessageBubble';
import { cn, formatDate } from '../lib/utils';
import type { Agent, Conversation } from '../types';

const ALL_AGENTS_KEY = '__all__';

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedConvId, setSelectedConvId] = useState<string | undefined>();
  const [selectedAgentId, setSelectedAgentId] = useState<string>(ALL_AGENTS_KEY);

  // Fetch team detail
  const { data: teamDetail } = useQuery({
    queryKey: ['team', id],
    queryFn: () => fetchTeam(id!),
    enabled: !!id,
  });

  const team = teamDetail?.team;
  const recentConversations = teamDetail?.recent_conversations;

  // Fetch agents list
  const { data: agents } = useQuery({
    queryKey: ['teamAgents', id],
    queryFn: () => fetchTeamAgents(id!),
    enabled: !!id,
  });

  // Fetch all conversations
  const { data: conversations } = useQuery({
    queryKey: ['teamConversations', id],
    queryFn: () => fetchTeamConversations(id!),
    enabled: !!id,
  });

  const allConversations = conversations ?? recentConversations ?? [];

  // Auto-select first conversation
  useEffect(() => {
    if (!selectedConvId && allConversations.length > 0) {
      setSelectedConvId(allConversations[0].id);
    }
  }, [selectedConvId, allConversations]);

  // Reset agent selection when conversation changes
  useEffect(() => {
    setSelectedAgentId(ALL_AGENTS_KEY);
  }, [selectedConvId]);

  // Fetch messages for selected conversation
  const { data: messages } = useQuery({
    queryKey: ['conversationMessages', selectedConvId],
    queryFn: () => fetchConversationMessages(selectedConvId!),
    enabled: !!selectedConvId,
    refetchInterval: 5000,
  });

  const handleConversationSelect = useCallback((conv: Conversation) => {
    setSelectedConvId(conv.id);
  }, []);

  // Find lead agent
  const leadAgent = useMemo(() => agents?.find((a) => a.role === 'lead'), [agents]);

  // Messages filtered per agent
  const getAgentMessages = useCallback(
    (agentId: string) => {
      if (!messages || !agents) return [];
      const isLead = leadAgent?.id === agentId;
      return messages.filter((m) => {
        if (m.agent_id === agentId) return true;
        if (isLead && (m.role === 'user' || !m.agent_id)) return true;
        return false;
      });
    },
    [messages, agents, leadAgent]
  );

  // Messages for the right pane based on selected agent
  const rightPaneMessages = useMemo(() => {
    if (!messages) return [];
    if (selectedAgentId === ALL_AGENTS_KEY) return messages;
    return getAgentMessages(selectedAgentId);
  }, [messages, selectedAgentId, getAgentMessages]);

  // The agent to display in the right pane header
  const rightPaneAgent = useMemo(() => {
    if (selectedAgentId === ALL_AGENTS_KEY) return null;
    return agents?.find((a) => a.id === selectedAgentId) ?? null;
  }, [agents, selectedAgentId]);

  const statusMap: Record<string, string> = { running: '运行中', idle: '空闲', stopped: '已停止' };

  return (
    <div className="h-full flex">
      {/* Left column: Conversation list (260px) */}
      <div className="w-[260px] shrink-0 border-r border-gray-800 bg-gray-900/30 flex flex-col overflow-hidden">
        {/* Team info header */}
        <div className="p-4 border-b border-gray-800 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            返回总览
          </Link>
          {team ? (
            <div>
              {team.team_name && (
                <Link
                  to={`/team-groups/${encodeURIComponent(team.team_name)}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 mb-2 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                >
                  {team.team_name} &rarr;
                </Link>
              )}
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-gray-100 truncate">{team.name}</h2>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0',
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
                  {statusMap[team.status] ?? team.status}
                </span>
              </div>
              {team.description && (
                <p className="text-xs text-gray-500 mb-2">{team.description}</p>
              )}
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                {formatDate(team.created_at)}
              </div>
            </div>
          ) : (
            <div className="animate-pulse space-y-2">
              <div className="h-5 bg-gray-800 rounded w-3/4" />
              <div className="h-3 bg-gray-800 rounded w-1/2" />
            </div>
          )}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 pt-3 pb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" />
            会话列表
          </h3>
          <div className="space-y-0.5 px-2 pb-2">
            {allConversations.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-8">暂无会话</p>
            ) : (
              allConversations.map((conv) => {
                const isSelected = selectedConvId === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleConversationSelect(conv)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200',
                      isSelected
                        ? 'bg-blue-500/10 border-l-2 border-blue-500'
                        : 'hover:bg-gray-800/50 border-l-2 border-transparent'
                    )}
                  >
                    <p className={cn('text-sm font-medium truncate', isSelected ? 'text-blue-300' : 'text-gray-300')}>
                      {conv.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(conv.started_at)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Middle column: Agent list (300px) */}
      <div className="w-[300px] shrink-0 border-r border-gray-800 bg-gray-900/20 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 shrink-0">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            智能体列表
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* "All messages" option */}
          <button
            onClick={() => setSelectedAgentId(ALL_AGENTS_KEY)}
            className={cn(
              'w-full text-left px-4 py-3 transition-all duration-200 border-b border-gray-800/50 flex items-center gap-2',
              selectedAgentId === ALL_AGENTS_KEY
                ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                : 'hover:bg-gray-800/40 border-l-2 border-l-transparent'
            )}
          >
            <Inbox className={cn('w-4 h-4', selectedAgentId === ALL_AGENTS_KEY ? 'text-blue-400' : 'text-gray-500')} />
            <span className={cn('text-sm font-medium', selectedAgentId === ALL_AGENTS_KEY ? 'text-blue-300' : 'text-gray-300')}>
              全部消息
            </span>
            {messages && (
              <span className="ml-auto text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full">
                {messages.length}
              </span>
            )}
          </button>

          {/* Agent items */}
          {agents?.map((agent: Agent) => (
            <AgentListItem
              key={agent.id}
              agent={agent}
              messages={getAgentMessages(agent.id)}
              isSelected={selectedAgentId === agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
            />
          ))}

          {!agents && (
            <div className="space-y-2 p-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-800/30 rounded-lg animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right column: Chat detail (flex-1) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {selectedConvId ? (
          rightPaneAgent ? (
            <AgentPane agent={rightPaneAgent} messages={rightPaneMessages} />
          ) : (
            /* All messages view */
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900/90 border-b border-gray-800 shrink-0">
                <Inbox className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-200">全部消息</span>
                <span className="text-[10px] text-gray-500 ml-auto">
                  {rightPaneMessages.length} 条消息
                </span>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2">
                {rightPaneMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                    暂无消息
                  </div>
                ) : (
                  rightPaneMessages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))
                )}
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            选择会话查看消息
          </div>
        )}
      </div>
    </div>
  );
}
