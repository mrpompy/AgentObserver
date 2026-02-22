import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Circle, Clock, User, MessageSquare } from 'lucide-react';
import { fetchTeam, fetchTeamAgents, fetchTeamConversations, fetchConversationMessages } from '../api/client';
import AgentPane from '../components/AgentPane';
import ConversationList from '../components/ConversationList';
import { cn, formatDate, getStatusColor, getStatusTextColor } from '../lib/utils';
import type { Team, Agent, Conversation, Message } from '../types';

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedConvId, setSelectedConvId] = useState<string | undefined>();

  const { data: team } = useQuery<Team>({
    queryKey: ['team', id],
    queryFn: () => fetchTeam(id!),
    enabled: !!id,
  });

  const { data: agents } = useQuery<Agent[]>({
    queryKey: ['teamAgents', id],
    queryFn: () => fetchTeamAgents(id!),
    enabled: !!id,
  });

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ['teamConversations', id],
    queryFn: () => fetchTeamConversations(id!),
    enabled: !!id,
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ['conversationMessages', selectedConvId],
    queryFn: () => fetchConversationMessages(selectedConvId!),
    enabled: !!selectedConvId,
    refetchInterval: 5000,
  });

  const handleConversationSelect = (conv: Conversation) => {
    setSelectedConvId(conv.id);
  };

  return (
    <div className="h-full flex">
      {/* Left sidebar */}
      <div className="w-72 shrink-0 border-r border-gray-800 bg-gray-900/30 flex flex-col overflow-hidden">
        {/* Team info */}
        <div className="p-4 border-b border-gray-800 shrink-0">
          <Link to="/" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
          {team ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-gray-100">{team.name}</h2>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase',
                    team.status === 'running' && 'bg-green-500/10 text-green-400',
                    team.status === 'idle' && 'bg-gray-500/10 text-gray-400',
                    team.status === 'stopped' && 'bg-red-500/10 text-red-400'
                  )}
                >
                  <Circle className={cn('w-1.5 h-1.5 fill-current', getStatusTextColor(team.status))} />
                  {team.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{team.description}</p>
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

        {/* Agent list */}
        <div className="p-3 border-b border-gray-800 shrink-0">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Agents</h3>
          <div className="space-y-0.5">
            {agents?.map((agent) => (
              <Link
                key={agent.id}
                to={`/agents/${agent.id}`}
                className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-800/50 transition-colors group"
              >
                <Circle
                  className={cn(
                    'w-2 h-2 shrink-0 fill-current',
                    getStatusColor(agent.status).replace('bg-', 'text-')
                  )}
                />
                <User className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                <span className="text-sm text-gray-300 group-hover:text-gray-100 truncate">{agent.name}</span>
                <span
                  className={cn(
                    'text-[9px] font-semibold uppercase px-1 py-0.5 rounded ml-auto shrink-0',
                    agent.role === 'lead'
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'bg-green-500/15 text-green-400'
                  )}
                >
                  {agent.role}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto p-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" />
            Conversations
          </h3>
          <ConversationList
            conversations={conversations ?? []}
            selectedId={selectedConvId}
            onSelect={handleConversationSelect}
          />
        </div>
      </div>

      {/* Main area - agent split panes */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {agents && agents.length > 0 ? (
          agents.map((agent) => (
            <div key={agent.id} className="flex-1 min-h-0 lg:min-w-0">
              <AgentPane agent={agent} messages={messages ?? []} />
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
            {selectedConvId ? 'Loading agents...' : 'Select a conversation to view messages'}
          </div>
        )}
      </div>
    </div>
  );
}
