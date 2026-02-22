import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { connected } = useWebSocket();

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-12 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between px-5 shrink-0">
          <span className="text-sm font-semibold text-gray-300">智能体观测台</span>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-600'}`}
            />
            <span className={connected ? 'text-green-400' : 'text-gray-500'}>
              {connected ? '已连接' : '未连接'}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
