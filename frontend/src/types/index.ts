export interface Team {
  id: string;
  name: string;
  description: string;
  created_by: string;
  status: 'running' | 'stopped' | 'idle';
  team_name?: string;
  created_at: string;
  agents?: Agent[];
}

export interface TeamWithStats extends Team {
  agent_count: number;
  conversation_count: number;
  message_count: number;
}

export interface TeamDetail {
  team: Team;
  recent_conversations: Conversation[];
  stats: {
    agent_count: number;
    conversation_count: number;
    message_count: number;
  };
}

export interface AgentDetail {
  agent: Agent;
  stats: {
    conversation_count: number;
    message_count: number;
    avg_token_usage: number;
  };
}

export interface Agent {
  id: string;
  team_id: string;
  role: 'lead' | 'teammate';
  name: string;
  specialty: string;
  status: 'active' | 'idle' | 'error';
  created_at: string;
}

export interface Conversation {
  id: string;
  team_id: string;
  agent_id: string;
  title: string;
  started_at: string;
  ended_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  team_id: string;
  agent_id?: string;
  role: 'user' | 'agent' | 'system' | 'teammate_message';
  content: string;
  raw_thoughts?: RawThoughts;
  created_at: string;
}

export interface RawThoughts {
  thinking?: string;
  tool_calls?: Array<{
    id?: string;
    name: string;
    input?: unknown;
    result?: string;
  }>;
  token_usage?: {
    input: number;
    output: number;
    cache_creation: number;
    cache_read: number;
  };
  // Legacy fields from old mock data
  iteration?: number;
  decision?: string;
  reasoning?: string;
  tokens_used?: number;
}

export interface Trace {
  id: string;
  team_id: string;
  agent_id: string;
  conversation_id: string;
  parent_span_id?: string;
  span_name: string;
  attributes?: Record<string, unknown>;
  start_time: string;
  end_time?: string;
  children?: Trace[];
  duration_ms?: number;
}
