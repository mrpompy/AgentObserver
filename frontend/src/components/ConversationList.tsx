import { MessageSquare, Clock } from 'lucide-react';
import type { Conversation } from '../types';
import { cn, formatRelativeTime } from '../lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
}

export default function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  return (
    <div className="space-y-0.5">
      {conversations.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-4">暂无会话</p>
      ) : (
        conversations.map((conv) => {
          const isSelected = selectedId === conv.id;
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-start gap-2.5',
                isSelected
                  ? 'bg-blue-500/10 border-l-2 border-blue-500'
                  : 'hover:bg-gray-800/50 border-l-2 border-transparent'
              )}
            >
              <MessageSquare
                className={cn(
                  'w-3.5 h-3.5 mt-0.5 shrink-0',
                  isSelected ? 'text-blue-400' : 'text-gray-600'
                )}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm font-medium truncate',
                    isSelected ? 'text-blue-300' : 'text-gray-300'
                  )}
                >
                  {conv.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(conv.started_at)}</span>
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
