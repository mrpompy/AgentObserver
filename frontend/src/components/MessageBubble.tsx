import { useState } from 'react';
import { ChevronDown, ChevronRight, Cpu, Wrench, Brain, Hash } from 'lucide-react';
import type { Message } from '../types';
import { cn, formatDate } from '../lib/utils';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [expanded, setExpanded] = useState(false);

  const hasThoughts = message.raw_thoughts && Object.keys(message.raw_thoughts).length > 0;

  const roleStyles: Record<string, string> = {
    user: 'ml-8 bg-blue-600/20 border-blue-500/30',
    agent: 'mr-8 bg-gray-800/80 border-gray-700/50',
    system: 'mx-auto max-w-lg bg-gray-800/40 border-gray-700/30 text-center italic',
    teammate_message: 'mr-8 bg-gray-800/80 border-l-2 border-l-green-500 border-t border-r border-b border-gray-700/50',
  };

  const roleLabels: Record<string, string> = {
    user: 'User',
    agent: 'Agent',
    system: 'System',
    teammate_message: 'Teammate',
  };

  const roleLabelColors: Record<string, string> = {
    user: 'text-blue-400',
    agent: 'text-cyan-400',
    system: 'text-gray-500',
    teammate_message: 'text-green-400',
  };

  return (
    <div className={cn('rounded-lg border p-3 mb-2', roleStyles[message.role] ?? roleStyles.agent)}>
      <div className="flex items-center justify-between mb-1">
        <span className={cn('text-xs font-medium', roleLabelColors[message.role] ?? 'text-gray-400')}>
          {roleLabels[message.role] ?? message.role}
        </span>
        <span className="text-xs text-gray-600">{formatDate(message.created_at)}</span>
      </div>

      <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{message.content}</p>

      {hasThoughts && (
        <div className="mt-2 pt-2 border-t border-gray-700/50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <Brain className="w-3.5 h-3.5" />
            Raw Thoughts
          </button>

          {expanded && message.raw_thoughts && (
            <div className="mt-2 space-y-2 text-xs">
              {message.raw_thoughts.iteration !== undefined && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Hash className="w-3.5 h-3.5" />
                  <span>Iteration: {message.raw_thoughts.iteration}</span>
                </div>
              )}

              {message.raw_thoughts.decision && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Decision: <span className="text-cyan-400">{message.raw_thoughts.decision}</span></span>
                </div>
              )}

              {message.raw_thoughts.reasoning && (
                <div className="bg-gray-900/60 rounded-md p-2">
                  <p className="text-gray-400 mb-1 font-medium">Reasoning:</p>
                  <p className="text-gray-300 whitespace-pre-wrap">{message.raw_thoughts.reasoning}</p>
                </div>
              )}

              {message.raw_thoughts.tool_calls && message.raw_thoughts.tool_calls.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Wrench className="w-3.5 h-3.5" />
                    <span className="font-medium">Tool Calls:</span>
                  </div>
                  {message.raw_thoughts.tool_calls.map((tool, i) => (
                    <div key={i} className="bg-gray-900/60 rounded-md p-2 font-mono">
                      <div className="text-blue-400 mb-1">{tool.name}</div>
                      <pre className="text-gray-400 overflow-x-auto text-[11px]">
                        {JSON.stringify(tool.args, null, 2)}
                      </pre>
                      {tool.result && (
                        <div className="mt-1.5 pt-1.5 border-t border-gray-700/50">
                          <span className="text-green-400">Result: </span>
                          <span className="text-gray-300">{tool.result}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {message.raw_thoughts.tokens_used !== undefined && (
                <div className="text-gray-500 text-right">
                  Tokens: {message.raw_thoughts.tokens_used.toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
