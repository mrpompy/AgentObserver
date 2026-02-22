import axios from 'axios';
import type { TeamWithStats, TeamDetail, AgentDetail, Agent, Conversation, Message, Trace } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// GET /api/teams returns TeamWithStats[] (flat: {id, name, ..., agent_count, conversation_count, message_count})
export async function fetchTeams(): Promise<TeamWithStats[]> {
  const { data } = await api.get<TeamWithStats[]>('/teams');
  return data;
}

// GET /api/teams/:id returns {team: Team, recent_conversations: Conversation[], stats: {...}}
export async function fetchTeam(id: string): Promise<TeamDetail> {
  const { data } = await api.get<TeamDetail>(`/teams/${id}`);
  return data;
}

// GET /api/teams/:id/agents returns Agent[] directly
export async function fetchTeamAgents(teamId: string): Promise<Agent[]> {
  const { data } = await api.get<Agent[]>(`/teams/${teamId}/agents`);
  return data;
}

// GET /api/agents/:id returns {agent: Agent, stats: {...}}
export async function fetchAgent(id: string): Promise<AgentDetail> {
  const { data } = await api.get<AgentDetail>(`/agents/${id}`);
  return data;
}

// GET /api/teams/:id/conversations returns Conversation[] directly
export async function fetchTeamConversations(teamId: string): Promise<Conversation[]> {
  const { data } = await api.get<Conversation[]>(`/teams/${teamId}/conversations`);
  return data;
}

// GET /api/conversations/:id/messages returns Message[] directly
export async function fetchConversationMessages(conversationId: string): Promise<Message[]> {
  const { data } = await api.get<Message[]>(`/conversations/${conversationId}/messages`);
  return data;
}

// GET /api/conversations/:id/traces returns Trace[] directly
export async function fetchConversationTraces(conversationId: string): Promise<Trace[]> {
  const { data } = await api.get<Trace[]>(`/conversations/${conversationId}/traces`);
  return data;
}

export async function fetchAgentTraces(agentId: string): Promise<Trace[]> {
  const { data } = await api.get<Trace[]>(`/agents/${agentId}/traces`);
  return data;
}
