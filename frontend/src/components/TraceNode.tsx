import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Trace } from '../types';
import { cn, formatDuration, getSpanColor, getSpanTextColor } from '../lib/utils';

interface TraceNodeProps {
  trace: Trace;
  depth?: number;
  maxDuration: number;
  onSelect: (trace: Trace) => void;
  selectedId?: string;
}

export default function TraceNode({ trace, depth = 0, maxDuration, onSelect, selectedId }: TraceNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = trace.children && trace.children.length > 0;
  const duration = trace.duration_ms ?? 0;
  const barWidth = maxDuration > 0 ? Math.max((duration / maxDuration) * 100, 2) : 2;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(trace);
          if (hasChildren) setExpanded(!expanded);
        }}
        className={cn(
          'w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors group',
          selectedId === trace.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <span className={cn('text-xs font-medium shrink-0', getSpanTextColor(trace.span_name))}>
          {trace.span_name}
        </span>

        <div className="flex-1 mx-2 h-3 bg-gray-800/50 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', getSpanColor(trace.span_name))}
            style={{ width: `${barWidth}%`, opacity: 0.6 }}
          />
        </div>

        <span className="text-[11px] text-gray-500 font-mono shrink-0">
          {formatDuration(duration)}
        </span>
      </button>

      {expanded && hasChildren && (
        <div>
          {trace.children!.map((child) => (
            <TraceNode
              key={child.id}
              trace={child}
              depth={depth + 1}
              maxDuration={maxDuration}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
