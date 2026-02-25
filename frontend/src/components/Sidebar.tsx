import { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Radar,
  Users,
} from 'lucide-react';
import { fetchTeams } from '../api/client';
import { cn } from '../lib/utils';
import type { TeamWithStats } from '../types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface TeamGroup {
  teamName: string;
  members: TeamWithStats[];
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const [sessionsExpanded, setSessionsExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const { data: teams } = useQuery<TeamWithStats[]>({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    refetchInterval: 10000,
  });

  // Group teams by team_name
  const { grouped, ungrouped } = useMemo(() => {
    if (!teams) return { grouped: [] as TeamGroup[], ungrouped: [] as TeamWithStats[] };
    const groups: Record<string, TeamWithStats[]> = {};
    const solo: TeamWithStats[] = [];
    for (const t of teams) {
      if (t.team_name) {
        if (!groups[t.team_name]) groups[t.team_name] = [];
        groups[t.team_name].push(t);
      } else {
        solo.push(t);
      }
    }
    const grouped = Object.entries(groups).map(([teamName, members]) => ({ teamName, members }));
    return { grouped, ungrouped: solo };
  }, [teams]);

  const toggleGroup = (teamName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [teamName]: !prev[teamName] }));
  };

  return (
    <aside
      className={cn(
        'h-screen bg-gray-900/80 border-r border-gray-800 flex flex-col transition-all duration-300',
        collapsed ? 'w-14' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-gray-800 shrink-0">
        <Radar className="w-5 h-5 text-cyan-400 shrink-0" />
        {!collapsed && (
          <span className="text-sm font-semibold text-gray-200 whitespace-nowrap">
            智能体观测台
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {/* Overview link */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 mb-1',
              isActive
                ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            )
          }
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          {!collapsed && <span>总览</span>}
        </NavLink>

        {/* Sessions header */}
        {!collapsed && (
          <div className="mt-4">
            <button
              onClick={() => setSessionsExpanded(!sessionsExpanded)}
              className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-400 transition-colors"
            >
              <span className="flex-1">会话记录</span>
              {teams && teams.length > 0 && (
                <span className="bg-gray-800 text-gray-400 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                  {teams.length}
                </span>
              )}
              {sessionsExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>

            {/* Team list with smooth collapse */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-300',
                sessionsExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="mt-1 space-y-0.5">
                {/* Grouped teams */}
                {grouped.map((group) => {
                  const isGroupExpanded = expandedGroups[group.teamName] !== false; // default expanded
                  const isGroupActive = location.pathname === `/team-groups/${encodeURIComponent(group.teamName)}`;
                  const hasRunning = group.members.some((m) => m.status === 'running');
                  return (
                    <div key={group.teamName}>
                      {/* Group header */}
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleGroup(group.teamName)}
                          className="flex items-center gap-1 px-1 py-1 text-gray-500 hover:text-gray-400 shrink-0"
                        >
                          {isGroupExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </button>
                        <NavLink
                          to={`/team-groups/${encodeURIComponent(group.teamName)}`}
                          className={cn(
                            'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all duration-200 flex-1 min-w-0',
                            isGroupActive
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                          )}
                        >
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate font-medium">{group.teamName}</span>
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full shrink-0 ml-auto',
                              hasRunning ? 'bg-green-500' : 'bg-gray-600'
                            )}
                          />
                          <span className="text-[10px] text-gray-600 shrink-0">
                            {group.members.length}
                          </span>
                        </NavLink>
                      </div>
                      {/* Group members */}
                      {isGroupExpanded && (
                        <div className="ml-4 space-y-0.5">
                          {group.members.map((team) => {
                            const isActive = location.pathname === `/sessions/${team.id}`;
                            return (
                              <NavLink
                                key={team.id}
                                to={`/sessions/${team.id}`}
                                className={cn(
                                  'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200',
                                  isActive
                                    ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500'
                                    : 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-300'
                                )}
                              >
                                <span
                                  className={cn(
                                    'w-1.5 h-1.5 rounded-full shrink-0',
                                    team.status === 'running' ? 'bg-green-500' : 'bg-gray-600'
                                  )}
                                />
                                <span className="truncate">{team.name}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Ungrouped teams */}
                {ungrouped.map((team) => {
                  const isActive = location.pathname === `/sessions/${team.id}`;
                  return (
                    <NavLink
                      key={team.id}
                      to={`/sessions/${team.id}`}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                        isActive
                          ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500'
                          : 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-300'
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          team.status === 'running' ? 'bg-green-500' : 'bg-gray-600'
                        )}
                      />
                      <span className="truncate">{team.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center py-3 border-t border-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
      >
        {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
      </button>
    </aside>
  );
}
