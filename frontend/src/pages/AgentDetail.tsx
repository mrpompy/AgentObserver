import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Circle,
  Clock,
  MessageSquare,
  Activity,
  User,
} from 'lucide-react';
import { fetchAgent, fetchAgentTraces } from '../api/client';
import TraceViewer from '../components/TraceViewer';
import { cn, formatDate, getStatusColor, getStatusTextColor } from '../lib/utils';
import type { Agent, Trace } from '../types';

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: agent } = useQuery<Agent>({
    queryKey: ['agent', id],
    queryFn: () => fetchAgent(id!),
    enabled: !!id,
  });

  const { data: traces } = useQuery<Trace[]>({
    queryKey: ['agentTraces', id],
    queryFn: () => fetchAgentTraces(id!),
    enabled: !!id,
  });

  return (
    <div className="p-6 space-y-6">
      <Link
        to={agent ? `/teams/${agent.team_id}` : '/'}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to team
      </Link>

      {/* Agent info */}
      {agent ? (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gray-800/80">
                <User className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-100">{agent.name}</h1>
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase px-2 py-0.5 rounded',
                      agent.role === 'lead'
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'bg-green-500/15 text-green-400'
                    )}
                  >
                    {agent.role}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                      agent.status === 'active' && 'bg-green-500/10 text-green-400',
                      agent.status === 'idle' && 'bg-gray-500/10 text-gray-400',
                      agent.status === 'error' && 'bg-red-500/10 text-red-400'
                    )}
                  >
                    <Circle
                      className={cn(
                        'w-1.5 h-1.5 fill-current',
                        getStatusColor(agent.status).replace('bg-', 'text-')
                      )}
                    />
                    {agent.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{agent.specialty}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-2">
                  <Clock className="w-3 h-3" />
                  Created {formatDate(agent.created_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-800/50">
                <MessageSquare className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Conversations</p>
                <p className="text-lg font-semibold text-gray-200">{traces ? new Set(traces.map(t => t.conversation_id)).size : 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-800/50">
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Traces</p>
                <p className="text-lg font-semibold text-gray-200">{traces?.length ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-800/50">
                <Circle
                  className={cn(
                    'w-4 h-4 fill-current',
                    getStatusTextColor(agent.status)
                  )}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className={cn('text-lg font-semibold', getStatusTextColor(agent.status))}>
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-48 mb-4" />
          <div className="h-4 bg-gray-800 rounded w-64" />
        </div>
      )}

      {/* Trace viewer */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Recent Traces</h2>
        <div className="h-96">
          <TraceViewer traces={traces ?? []} />
        </div>
      </div>
    </div>
  );
}
