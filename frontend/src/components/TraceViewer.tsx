import { useState, useMemo } from 'react';
import { Clock, Tag, FileText } from 'lucide-react';
import type { Trace } from '../types';
import { formatDate, formatDuration, getSpanTextColor } from '../lib/utils';
import TraceNode from './TraceNode';

interface TraceViewerProps {
  traces: Trace[];
}

function buildTree(traces: Trace[]): Trace[] {
  const map = new Map<string, Trace>();
  const roots: Trace[] = [];

  for (const trace of traces) {
    map.set(trace.id, { ...trace, children: [] });
  }

  for (const trace of traces) {
    const node = map.get(trace.id)!;
    if (trace.parent_span_id && map.has(trace.parent_span_id)) {
      const parent = map.get(trace.parent_span_id)!;
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function getMaxDuration(traces: Trace[]): number {
  let max = 0;
  for (const t of traces) {
    const d = t.duration_ms ?? 0;
    if (d > max) max = d;
    if (t.children) {
      const childMax = getMaxDuration(t.children);
      if (childMax > max) max = childMax;
    }
  }
  return max;
}

export default function TraceViewer({ traces }: TraceViewerProps) {
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);

  const tree = useMemo(() => buildTree(traces), [traces]);
  const maxDuration = useMemo(() => getMaxDuration(tree), [tree]);

  return (
    <div className="flex h-full border border-gray-800 rounded-lg overflow-hidden">
      {/* Tree */}
      <div className="w-1/2 border-r border-gray-800 overflow-y-auto bg-gray-900/30 p-2">
        {tree.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-8">No traces available</p>
        ) : (
          tree.map((trace) => (
            <TraceNode
              key={trace.id}
              trace={trace}
              maxDuration={maxDuration}
              onSelect={setSelectedTrace}
              selectedId={selectedTrace?.id}
            />
          ))
        )}
      </div>

      {/* Detail panel */}
      <div className="w-1/2 overflow-y-auto bg-gray-950/50 p-4">
        {selectedTrace ? (
          <div className="space-y-4">
            <div>
              <h3 className={`text-base font-semibold ${getSpanTextColor(selectedTrace.span_name)}`}>
                {selectedTrace.span_name}
              </h3>
              <p className="text-xs text-gray-600 mt-1 font-mono">{selectedTrace.id}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-400">Start:</span>
                <span className="text-gray-200 font-mono text-xs">{formatDate(selectedTrace.start_time)}</span>
              </div>
              {selectedTrace.end_time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">End:</span>
                  <span className="text-gray-200 font-mono text-xs">{formatDate(selectedTrace.end_time)}</span>
                </div>
              )}
              {selectedTrace.duration_ms !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-gray-200 font-mono">{formatDuration(selectedTrace.duration_ms)}</span>
                </div>
              )}
            </div>

            {selectedTrace.attributes && Object.keys(selectedTrace.attributes).length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <FileText className="w-4 h-4" />
                  <span>Attributes</span>
                </div>
                <pre className="bg-gray-900/60 rounded-md p-3 text-xs text-gray-300 font-mono overflow-x-auto">
                  {JSON.stringify(selectedTrace.attributes, null, 2)}
                </pre>
              </div>
            )}

            {selectedTrace.parent_span_id && (
              <div className="text-xs text-gray-600">
                Parent: <span className="font-mono">{selectedTrace.parent_span_id}</span>
              </div>
            )}

            {selectedTrace.children && selectedTrace.children.length > 0 && (
              <div className="text-xs text-gray-600">
                Children: {selectedTrace.children.length} span(s)
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            Select a trace to view details
          </div>
        )}
      </div>
    </div>
  );
}
