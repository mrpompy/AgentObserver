import { Bot, MessageSquare } from 'lucide-react';
import type { Agent, Message } from '../types';
import { cn, formatRelativeTime } from '../lib/utils';

interface AgentListItemProps {
  agent: Agent;
  messages: Message[];
  isSelected: boolean;
  onClick: () => void;
}

export default function AgentListItem({ agent, messages, isSelected, onClick }: AgentListItemProps) {
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const roleLabel = agent.role === 'lead' ? '主导' : '协作';
  const statusMap: Record<string, string> = { active: '活跃', idle: '空闲', error: '错误' };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-3 transition-all duration-200 border-b border-gray-800/50',
        isSelected
          ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
          : 'hover:bg-gray-800/40 border-l-2 border-l-transparent'
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Bot className={cn('w-4 h-4 shrink-0', agent.role === 'lead' ? 'text-blue-400' : 'text-emerald-400')} />
        <span className={cn('text-sm font-medium truncate flex-1', isSelected ? 'text-blue-300' : 'text-gray-200')}>
          {agent.name}
        </span>
        <span
          className={cn(
            'text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0',
            agent.role === 'lead' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'
          )}
        >
          {roleLabel}
        </span>
      </div>

      {/* Status + message count */}
      <div className="flex items-center gap-2 mb-1.5 ml-6">
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            agent.status === 'active' ? 'bg-green-500' : agent.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
          )}
        />
        <span className="text-[10px] text-gray-500">{statusMap[agent.status] ?? agent.status}</span>
        {agent.specialty && (
          <span className="text-[10px] text-gray-600 truncate">{agent.specialty}</span>
        )}
      </div>

      {/* Last message preview */}
      {lastMessage ? (
        <div className="ml-6 flex items-start gap-1.5">
          <p className="text-xs text-gray-500 line-clamp-2 flex-1">{lastMessage.content}</p>
        </div>
      ) : (
        <p className="text-xs text-gray-600 ml-6 italic">暂无消息</p>
      )}

      {/* Footer: message count + time */}
      <div className="flex items-center gap-2 mt-1.5 ml-6 text-[10px] text-gray-600">
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {messages.length} 条消息
        </span>
        {lastMessage && (
          <span className="ml-auto">{formatRelativeTime(lastMessage.created_at)}</span>
        )}
      </div>
    </button>
  );
}
