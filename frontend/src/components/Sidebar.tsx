import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Radar,
  Circle,
} from 'lucide-react';
import { fetchTeams } from '../api/client';
import { cn, getStatusColor } from '../lib/utils';
import type { Team } from '../types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const [teamsExpanded, setTeamsExpanded] = useState(true);

  const { data: teams } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    refetchInterval: 10000,
  });

  return (
    <aside
      className={cn(
        'h-screen bg-gray-900/80 backdrop-blur-sm border-r border-gray-800 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <Radar className="w-7 h-7 text-cyan-400 shrink-0" />
        {!collapsed && (
          <span className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent whitespace-nowrap">
            Agent Observer
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1',
              isActive
                ? 'bg-blue-500/15 text-blue-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            )
          }
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Overview</span>}
        </NavLink>

        {/* Teams section */}
        <div className="mt-4">
          <button
            onClick={() => setTeamsExpanded(!teamsExpanded)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left mb-1',
              location.pathname.startsWith('/teams')
                ? 'bg-blue-500/15 text-blue-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            )}
          >
            <Users className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">Teams</span>
                {teamsExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </>
            )}
          </button>

          {!collapsed && teamsExpanded && teams && (
            <div className="ml-4 border-l border-gray-800 pl-2 space-y-0.5">
              {teams.map((team) => (
                <NavLink
                  key={team.id}
                  to={`/teams/${team.id}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-gray-800 text-gray-100'
                        : 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-300'
                    )
                  }
                >
                  <Circle
                    className={cn('w-2 h-2 shrink-0 fill-current', getStatusColor(team.status).replace('bg-', 'text-'))}
                  />
                  <span className="truncate">{team.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center py-3 border-t border-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
      >
        {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
      </button>
    </aside>
  );
}
