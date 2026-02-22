import { useEffect, useRef } from 'react';
import { Circle } from 'lucide-react';
import type { Agent, Message } from '../types';
import { cn, getStatusColor } from '../lib/utils';
import MessageBubble from './MessageBubble';

interface AgentPaneProps {
  agent: Agent;
  messages: Message[];
}

export default function AgentPane({ agent, messages }: AgentPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const agentMessages = messages.filter((m) => m.agent_id === agent.id || m.role === 'user');

  return (
    <div className="flex flex-col h-full border-r border-gray-800 last:border-r-0 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/90 border-b border-gray-800 shrink-0">
        <Circle
          className={cn(
            'w-2 h-2 shrink-0 fill-current',
            getStatusColor(agent.status).replace('bg-', 'text-')
          )}
        />
        <span className="text-sm font-medium text-gray-200 truncate">{agent.name}</span>
        <span
          className={cn(
            'text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded',
            agent.role === 'lead'
              ? 'bg-blue-500/15 text-blue-400'
              : 'bg-green-500/15 text-green-400'
          )}
        >
          {agent.role}
        </span>
        <span className="text-[10px] text-gray-600 ml-auto truncate">{agent.specialty}</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1">
        {agentMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            No messages yet
          </div>
        ) : (
          agentMessages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>
    </div>
  );
}
