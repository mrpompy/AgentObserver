import { useState } from 'react';
import { ChevronDown, ChevronRight, Brain, Bot, Terminal } from 'lucide-react';
import type { Message } from '../types';
import { formatRelativeTime } from '../lib/utils';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [expanded, setExpanded] = useState(false);

  const hasThinking = message.raw_thoughts?.thinking;
  const hasToolCalls = message.raw_thoughts?.tool_calls && message.raw_thoughts.tool_calls.length > 0;
  const hasTokenUsage = message.raw_thoughts?.token_usage;
  const hasLegacyThoughts = message.raw_thoughts?.reasoning || message.raw_thoughts?.decision;
  const hasThoughts = hasThinking || hasToolCalls || hasTokenUsage || hasLegacyThoughts;

  // System messages: full-width centered
  if (message.role === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="max-w-lg bg-gray-900/50 rounded-lg px-4 py-2 text-center">
          <p className="text-xs text-gray-500 italic whitespace-pre-wrap">{message.content}</p>
          <p className="text-[10px] text-gray-700 mt-1">{formatRelativeTime(message.created_at)}</p>
        </div>
      </div>
    );
  }

  // User messages: right-aligned blue bubble
  if (message.role === 'user') {
    return (
      <div className="flex justify-end my-2">
        <div className="max-w-[80%]">
          <p className="text-[10px] text-gray-500 mb-1 text-right mr-1">用户</p>
          <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-2.5">
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <p className="text-[10px] text-gray-600 mt-1 text-right mr-1">
            {formatRelativeTime(message.created_at)}
          </p>
        </div>
      </div>
    );
  }

  // Teammate messages: left-aligned with green accent
  if (message.role === 'teammate_message') {
    return (
      <div className="flex justify-start my-2">
        <div className="max-w-[85%]">
          <p className="text-[10px] text-green-500 mb-1 ml-1">协作体</p>
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-green-900/50 border border-green-800 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3 h-3 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-green-900/20 border-l-2 border-green-500 rounded-2xl rounded-bl-md px-4 py-2.5">
                <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{message.content}</p>
              </div>
              <div className="flex items-center gap-2 mt-1 ml-1">
                <p className="text-[10px] text-gray-600">
                  {formatRelativeTime(message.created_at)}
                </p>
                {hasThoughts && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <Brain className="w-3 h-3" />
                    查看思考
                  </button>
                )}
              </div>
              {expanded && hasThoughts && (
                <ThinkingPanel message={message} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Agent messages: left-aligned gray bubble with avatar
  return (
    <div className="flex justify-start my-2">
      <div className="max-w-[85%]">
        <p className="text-[10px] text-cyan-500 mb-1 ml-1">智能体</p>
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2.5">
              <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{message.content}</p>
            </div>
            <div className="flex items-center gap-2 mt-1 ml-1">
              <p className="text-[10px] text-gray-600">
                {formatRelativeTime(message.created_at)}
              </p>
              {hasThoughts && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <Brain className="w-3 h-3" />
                  查看思考
                </button>
              )}
            </div>
            {expanded && hasThoughts && (
              <ThinkingPanel message={message} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThinkingPanel({ message }: { message: Message }) {
  const rt = message.raw_thoughts;
  if (!rt) return null;

  const totalTokens = rt.token_usage
    ? rt.token_usage.input + rt.token_usage.output
    : undefined;

  return (
    <div className="mt-2 ml-8 bg-gray-900/80 border border-gray-800 rounded-lg p-3 transition-all duration-200">
      <div className="flex items-center gap-1.5 mb-2">
        <Brain className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-xs font-medium text-purple-400">思考过程</span>
      </div>

      {/* Thinking text */}
      {rt.thinking && (
        <div className="mb-2">
          <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono bg-gray-950/50 rounded-md p-2 max-h-48 overflow-y-auto">
            {rt.thinking}
          </pre>
        </div>
      )}

      {/* Legacy reasoning */}
      {rt.reasoning && !rt.thinking && (
        <div className="mb-2">
          <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono bg-gray-950/50 rounded-md p-2 max-h-48 overflow-y-auto">
            {rt.reasoning}
          </pre>
        </div>
      )}

      {/* Legacy decision */}
      {rt.decision && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-400">
          <span className="text-gray-500">决策：</span>
          <span className="text-cyan-400 font-medium">{rt.decision}</span>
        </div>
      )}

      {/* Tool calls */}
      {rt.tool_calls && rt.tool_calls.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {rt.tool_calls.map((tool, i) => (
            <ToolCallItem key={tool.id ?? i} tool={tool} />
          ))}
        </div>
      )}

      {/* Token usage */}
      {rt.token_usage && totalTokens !== undefined && (
        <div className="border-t border-gray-800 pt-2 mt-2">
          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
            <span>Token 用量</span>
            <span>共 {totalTokens.toLocaleString()}</span>
          </div>
          <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-800">
            <div
              className="bg-blue-500"
              style={{ width: `${totalTokens > 0 ? (rt.token_usage.input / totalTokens) * 100 : 0}%` }}
            />
            <div
              className="bg-cyan-500"
              style={{ width: `${totalTokens > 0 ? (rt.token_usage.output / totalTokens) * 100 : 0}%` }}
            />
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-600">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              输入: {rt.token_usage.input.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              输出: {rt.token_usage.output.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Legacy tokens */}
      {rt.tokens_used !== undefined && !rt.token_usage && (
        <div className="text-[10px] text-gray-600 text-right mt-1">
          Token: {rt.tokens_used.toLocaleString()}
        </div>
      )}
    </div>
  );
}

function ToolCallItem({ tool }: { tool: { id?: string; name: string; input?: unknown; result?: string } }) {
  const [showInput, setShowInput] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const inputStr = tool.input != null
    ? (typeof tool.input === 'string' ? tool.input : JSON.stringify(tool.input as Record<string, unknown>, null, 2))
    : null;
  const inputPreview = inputStr && inputStr.length > 120 ? inputStr.slice(0, 120) + '...' : inputStr;
  const inputIsLong = inputStr != null && inputStr.length > 120;

  const resultStr = tool.result ?? null;
  const resultPreview = resultStr && resultStr.length > 100 ? resultStr.slice(0, 100) + '...' : resultStr;
  const resultIsLong = resultStr != null && resultStr.length > 100;

  return (
    <div className="bg-gray-950/50 rounded-md p-2">
      <div className="flex items-center gap-2">
        <Terminal className="w-3 h-3 text-blue-400 shrink-0" />
        <span className="text-[11px] font-medium text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
          {tool.name}
        </span>
      </div>

      {/* Input */}
      {inputStr && (
        <div className="mt-1.5">
          <button
            onClick={() => inputIsLong && setShowInput(!showInput)}
            className={`w-full text-left ${inputIsLong ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <pre className="text-[10px] text-gray-500 whitespace-pre-wrap break-all font-mono bg-gray-900/50 rounded p-1.5 max-h-64 overflow-y-auto">
              {showInput ? inputStr : inputPreview}
            </pre>
          </button>
          {inputIsLong && (
            <button
              onClick={() => setShowInput(!showInput)}
              className="text-[10px] text-blue-500 hover:text-blue-400 mt-0.5"
            >
              {showInput ? '收起' : '展开全部'}
            </button>
          )}
        </div>
      )}

      {/* Result */}
      {resultStr && (
        <div className="mt-1.5">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[10px] text-gray-600">输出结果：</span>
          </div>
          <button
            onClick={() => resultIsLong && setShowResult(!showResult)}
            className={`w-full text-left ${resultIsLong ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <pre className="text-[10px] text-green-500/80 whitespace-pre-wrap break-all font-mono bg-gray-900/50 rounded p-1.5 max-h-64 overflow-y-auto">
              {showResult ? resultStr : resultPreview}
            </pre>
          </button>
          {resultIsLong && (
            <button
              onClick={() => setShowResult(!showResult)}
              className="text-[10px] text-blue-500 hover:text-blue-400 mt-0.5"
            >
              {showResult ? '收起' : '展开全部'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
