import { format, parseISO } from 'date-fns';

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy HH:mm');
  } catch {
    return dateStr;
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 30) return '刚刚';
    if (diffSec < 60) return `${diffSec}秒前`;
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHr < 24) return `${diffHr}小时前`;
    if (diffDay < 30) return `${diffDay}天前`;
    return format(date, 'MM-dd');
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
