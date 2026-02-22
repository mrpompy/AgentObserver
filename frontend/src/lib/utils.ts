import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy HH:mm');
  } catch {
    return dateStr;
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'running':
    case 'active':
      return 'bg-green-500';
    case 'idle':
      return 'bg-gray-500';
    case 'stopped':
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export function getStatusTextColor(status: string): string {
  switch (status) {
    case 'running':
    case 'active':
      return 'text-green-400';
    case 'idle':
      return 'text-gray-400';
    case 'stopped':
    case 'error':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

export function getSpanColor(spanName: string): string {
  if (spanName.startsWith('llm')) return 'bg-purple-500';
  if (spanName.startsWith('tool')) return 'bg-blue-500';
  if (spanName.includes('decision')) return 'bg-cyan-500';
  if (spanName.includes('error')) return 'bg-red-500';
  return 'bg-gray-500';
}

export function getSpanTextColor(spanName: string): string {
  if (spanName.startsWith('llm')) return 'text-purple-400';
  if (spanName.startsWith('tool')) return 'text-blue-400';
  if (spanName.includes('decision')) return 'text-cyan-400';
  if (spanName.includes('error')) return 'text-red-400';
  return 'text-gray-400';
}
