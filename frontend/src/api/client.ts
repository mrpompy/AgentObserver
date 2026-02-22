import axios from 'axios';
import type { Team, Agent, Conversation, Message, Trace } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchTeams(): Promise<Team[]> {
  const { data } = await api.get<Team[]>('/teams');
  return data;
}

export async function fetchTeam(id: string): Promise<Team> {
  const { data } = await api.get<Team>(`/teams/${id}`);
  return data;
}

export async function fetchTeamAgents(teamId: string): Promise<Agent[]> {
  const { data } = await api.get<Agent[]>(`/teams/${teamId}/agents`);
  return data;
}

export async function fetchAgent(id: string): Promise<Agent> {
  const { data } = await api.get<Agent>(`/agents/${id}`);
  return data;
}

export async function fetchTeamConversations(teamId: string): Promise<Conversation[]> {
  const { data } = await api.get<Conversation[]>(`/teams/${teamId}/conversations`);
  return data;
}

export async function fetchConversationMessages(conversationId: string): Promise<Message[]> {
  const { data } = await api.get<Message[]>(`/conversations/${conversationId}/messages`);
  return data;
}

export async function fetchConversationTraces(conversationId: string): Promise<Trace[]> {
  const { data } = await api.get<Trace[]>(`/conversations/${conversationId}/traces`);
  return data;
}

export async function fetchAgentTraces(agentId: string): Promise<Trace[]> {
  const { data } = await api.get<Trace[]>(`/agents/${agentId}/traces`);
  return data;
}
