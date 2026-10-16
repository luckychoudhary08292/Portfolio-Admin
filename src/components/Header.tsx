import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  RefreshCw,
  Award,
  FolderGit2,
  Cpu,
  Briefcase,
  ShieldCheck,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { DbStatusInfo, AuthUser } from '../types.ts';

interface HeaderProps {
  dbStatus: DbStatusInfo | null;
  currentUser: AuthUser | null;
  onRefreshAll: () => void;
  onOpenDbSync: () => void;
  onQuickNew: (type: 'certificate' | 'project' | 'skill' | 'experience') => void;
  onLogout: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  isLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  dbStatus,
  currentUser,
  onRefreshAll,
  onOpenDbSync,
  onQuickNew,
  onLogout,
  onShowToast,
  isLoading,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isGuest = currentUser?.role === 'guest';

  const handleCreateClick = () => {
    if (isGuest) {
      onShowToast(
        'Guest Demo Mode (Read-Only)',
        'Creating or modifying content is disabled in guest mode. Log in as Admin to create new items.',
        'info'
      );
      return;
    }
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <header className="sticky top-0 z-40 w-full h-14 border-b border-sky-100 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Clean Brand Wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center text-slate-900 font-bold text-xs shadow-xs">
          PA
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-950 tracking-tight">Portfolio Admin</h1>
        </div>
      </div>

      {/* Right: Auth Badge, Refresh, Create, Logout Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* User Role Badge */}
        {currentUser && (
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
              isGuest
                ? 'bg-sky-50 border-sky-300 text-sky-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
            title={
              isGuest
                ? 'Logged in as Guest Visitor (Read-Only Access)'
                : 'Logged in as Admin (Full Control)'
            }
          >
            {isGuest ? (
              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{isGuest ? 'Guest (Read-Only)' : 'Lucky (Admin)'}</span>
          </div>
        )}

        {/* Refresh All Button */}
        <button
          onClick={onRefreshAll}
          disabled={isLoading}
          className="p-1.5 rounded-lg border border-sky-200 bg-sky-50/60 hover:bg-orange-50 hover:border-orange-300 text-slate-700 hover:text-orange-600 transition cursor-pointer disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-500' : ''}`} />
        </button>

        {/* New Item Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleCreateClick}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer ${
              isGuest
                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-orange-500/25'
            }`}
            title={isGuest ? 'Disabled in Guest Demo Mode' : 'Create New Portfolio Item'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create</span>
            {isGuest && <span className="text-[10px] opacity-75 font-normal">(demo)</span>}
          </button>

          {!isGuest && dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-sky-200 shadow-xl p-1.5 z-50 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onQuickNew('certificate');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-700 text-left transition text-slate-800 font-medium cursor-pointer"
              >
                <Award className="w-4 h-4 text-orange-500" />
                <span>Certificate</span>
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onQuickNew('project');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-700 text-left transition text-slate-800 font-medium cursor-pointer"
              >
                <FolderGit2 className="w-4 h-4 text-orange-500" />
                <span>Project</span>
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onQuickNew('skill');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-700 text-left transition text-slate-800 font-medium cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-orange-500" />
                <span>Skill Category</span>
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onQuickNew('experience');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-700 text-left transition text-slate-800 font-medium cursor-pointer"
              >
                <Briefcase className="w-4 h-4 text-orange-500" />
                <span>Experience</span>
              </button>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-semibold transition cursor-pointer"
          title="Sign Out / Switch User"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
