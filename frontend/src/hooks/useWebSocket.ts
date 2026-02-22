import { useEffect, useRef, useState, useCallback } from 'react';
import type { Message, Trace } from '../types';

interface WebSocketEvent {
  type: 'message' | 'trace';
  data: Message | Trace;
}

interface UseWebSocketReturn {
  messages: Message[];
  traces: Trace[];
  connected: boolean;
  clearMessages: () => void;
  clearTraces: () => void;
}

export function useWebSocket(url = '/ws'): UseWebSocketReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = url.startsWith('ws') ? url : `${protocol}//${window.location.host}${url}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) {
          setConnected(true);
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const parsed = JSON.parse(event.data) as WebSocketEvent;
          if (parsed.type === 'message') {
            setMessages((prev) => [...prev, parsed.data as Message]);
          } else if (parsed.type === 'trace') {
            setTraces((prev) => [...prev, parsed.data as Trace]);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (mountedRef.current) {
          setConnected(false);
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      if (mountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const clearMessages = useCallback(() => setMessages([]), []);
  const clearTraces = useCallback(() => setTraces([]), []);

  return { messages, traces, connected, clearMessages, clearTraces };
}
