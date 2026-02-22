import { useEffect, useRef } from 'react';
import type { Agent, Message } from '../types';
import { cn } from '../lib/utils';
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

  const borderColor = agent.role === 'lead' ? 'border-l-blue-500' : 'border-l-emerald-500';
  const roleBg = agent.role === 'lead' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400';
  const statusDot = agent.status === 'active' ? 'bg-green-500' : agent.status === 'error' ? 'bg-red-500' : 'bg-gray-500';

  return (
    <div className={cn('flex flex-col h-full border-l-2 min-w-0', borderColor, 'first:border-l-0')}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/90 border-b border-gray-800 shrink-0">
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot)} />
        <span className="text-sm font-medium text-gray-200 truncate">{agent.name}</span>
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', roleBg)}>
          {agent.role === 'lead' ? '主导' : '协作'}
        </span>
        {agent.specialty && (
          <span className="text-[10px] text-gray-600 ml-auto truncate">{agent.specialty}</span>
        )}
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            暂无消息
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>
    </div>
  );
}
