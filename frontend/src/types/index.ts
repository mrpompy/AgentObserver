export interface Team {
  id: string;
  name: string;
  description: string;
  created_by: string;
  status: 'running' | 'stopped' | 'idle';
  created_at: string;
  agents?: Agent[];
  stats?: {
    agent_count: number;
    conversation_count: number;
    message_count: number;
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
  raw_thoughts?: {
    iteration?: number;
    decision?: string;
    tool_calls?: Array<{ name: string; args: Record<string, unknown>; result?: string }>;
    reasoning?: string;
    tokens_used?: number;
  };
  created_at: string;
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
