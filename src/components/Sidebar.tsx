import React from 'react';
import {
  LayoutDashboard,
  Award,
  FolderGit2,
  Cpu,
  UserCheck,
  Briefcase,
  Inbox,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { StatsOverview, AuthUser } from '../types.ts';

export type NavTab =
  | 'overview'
  | 'certificates'
  | 'projects'
  | 'skills'
  | 'profile'
  | 'experiences'
  | 'inquiries'
  | 'dbsync';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  stats: StatsOverview | null;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  stats,
  currentUser,
  onLogout,
}) => {
  const counts = stats?.counts;
  const isGuest = currentUser?.role === 'guest';

  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'profile' as NavTab,
      label: 'Profile',
      icon: UserCheck,
      badge: null,
    },
    {
      id: 'skills' as NavTab,
      label: 'Skills',
      icon: Cpu,
      badge: counts?.skillCategories,
    },
    {
      id: 'projects' as NavTab,
      label: 'Projects',
      icon: FolderGit2,
      badge: counts?.projects,
    },
    {
      id: 'certificates' as NavTab,
      label: 'Certificates',
      icon: Award,
      badge: counts?.certificates,
    },
    {
      id: 'experiences' as NavTab,
      label: 'Experience',
      icon: Briefcase,
      badge: counts?.experiences,
    },
    {
      id: 'inquiries' as NavTab,
      label: 'Inquiries',
      icon: Inbox,
      badge: counts?.newInquiries ? `${counts.newInquiries} new` : counts?.inquiries,
      hasNew: Boolean(counts?.newInquiries && counts.newInquiries > 0),
    },
  ];

  return (
    <aside className="w-60 border-r border-sky-100 bg-white/90 backdrop-blur-md flex flex-col shrink-0 select-none shadow-xs justify-between">
      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-800">
          Collections
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white font-semibold shadow-sm shadow-orange-500/25'
                  : 'text-slate-800 hover:text-orange-600 hover:bg-orange-50/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-600 group-hover:text-orange-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge !== null && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-medium transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.hasNew
                      ? 'bg-orange-100 text-orange-800 font-semibold border border-orange-200'
                      : 'bg-sky-100 text-sky-800 border border-sky-200/60'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Session Footer Card */}
      {currentUser && (
        <div className="p-3 border-t border-sky-100 bg-sky-50/40">
          <div className="p-2.5 rounded-xl bg-white border border-sky-200/70 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {isGuest ? (
                    <UserCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {isGuest ? 'Guest Visitor' : 'Admin'}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 truncate mt-0.5" title={currentUser.email}>
                  {currentUser.email}
                </p>
                <div className="mt-1.5 flex items-center gap-1">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isGuest ? 'bg-sky-500' : 'bg-emerald-500'
                    }`}
                  ></span>
                  <span className="text-[10px] font-medium text-slate-600">
                    {isGuest ? 'Read-Only Demo' : 'Full Permissions'}
                  </span>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Sign Out / Switch Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
