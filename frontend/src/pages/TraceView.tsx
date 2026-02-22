import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { fetchConversationTraces } from '../api/client';
import TraceViewer from '../components/TraceViewer';
import type { Trace } from '../types';

export default function TraceView() {
  const { id } = useParams<{ id: string }>();

  const { data: traces, isLoading } = useQuery<Trace[]>({
    queryKey: ['conversationTraces', id],
    queryFn: () => fetchConversationTraces(id!),
    enabled: !!id,
  });

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="shrink-0 mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
        <h1 className="text-xl font-bold text-gray-100">Trace View</h1>
        <p className="text-sm text-gray-500 mt-1">
          Conversation: <span className="font-mono text-gray-400">{id}</span>
        </p>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 animate-pulse h-full" />
        ) : (
          <TraceViewer traces={traces ?? []} />
        )}
      </div>
    </div>
  );
}
