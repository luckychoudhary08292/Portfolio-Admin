import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { OverviewView } from './components/views/OverviewView.tsx';
import { CertificatesView } from './components/views/CertificatesView.tsx';
import { ProjectsView } from './components/views/ProjectsView.tsx';
import { SkillsView } from './components/views/SkillsView.tsx';
import { ProfileView } from './components/views/ProfileView.tsx';
import { ExperiencesView } from './components/views/ExperiencesView.tsx';
import { InquiriesView } from './components/views/InquiriesView.tsx';
import { DbSyncModal } from './components/modals/DbSyncModal.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { ToastContainer, ToastMessage } from './components/Toast.tsx';
import { api, getAuthToken } from './services/api.ts';
import {
  CertificateItem,
  ProjectItem,
  SkillCategoryItem,
  ProfileData,
  ExperienceItem,
  InquiryItem,
  StatsOverview,
  DbStatusInfo,
  AuthUser,
} from './types.ts';
import { UserCheck, ShieldAlert, LogIn } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatusInfo | null>(null);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [skills, setSkills] = useState<SkillCategoryItem[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isDbSyncOpen, setIsDbSyncOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Trigger modal open for quick creates
  const [quickCreateType, setQuickCreateType] = useState<string | null>(null);

  const showToast = useCallback(
    (title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch all collections
  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        statsRes,
        statusRes,
        certsRes,
        projectsRes,
        skillsRes,
        profileRes,
        expRes,
        inqRes,
      ] = await Promise.allSettled([
        api.getStats(),
        api.getStatus(),
        api.getCertificates(),
        api.getProjects(),
        api.getSkills(),
        api.getProfile(),
        api.getExperiences(),
        api.getInquiries(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (statusRes.status === 'fulfilled') setDbStatus(statusRes.value);
      if (certsRes.status === 'fulfilled') setCertificates(certsRes.value);
      if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value);
      if (skillsRes.status === 'fulfilled') setSkills(skillsRes.value);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value);
      if (expRes.status === 'fulfilled') setExperiences(expRes.value);
      if (inqRes.status === 'fulfilled') setInquiries(inqRes.value);
    } catch (err: any) {
      console.error('Failed to load portfolio data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check existing session on load
  useEffect(() => {
    async function verifySession() {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setCurrentUser(res.user);
            await loadAllData();
          } else {
            api.logout();
            setCurrentUser(null);
          }
        } catch {
          api.logout();
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthChecking(false);
    }
    verifySession();
  }, [loadAllData]);

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    showToast('Signed Out', 'You have returned to the login screen.', 'info');
  };

  const handleQuickNew = (
    type: 'certificate' | 'project' | 'skill' | 'experience'
  ) => {
    if (currentUser?.role === 'guest') {
      showToast(
        'Guest Demo Mode (Read-Only)',
        'Creating new portfolio entries is restricted. Sign in with Admin credentials to create items.',
        'info'
      );
      return;
    }
    const tabMap: Record<string, NavTab> = {
      certificate: 'certificates',
      project: 'projects',
      skill: 'skills',
      experience: 'experiences',
    };
    setCurrentTab(tabMap[type]);
    setQuickCreateType(type);
  };

  // Reset quick create type after component consumes it
  useEffect(() => {
    if (quickCreateType) {
      const timer = setTimeout(() => setQuickCreateType(null), 500);
      return () => clearTimeout(timer);
    }
  }, [quickCreateType]);

  const handleSelectTab = (tab: NavTab) => {
    if (tab === 'dbsync') {
      setIsDbSyncOpen(true);
      return;
    }
    setCurrentTab(tab);
  };

  // 1. Initial Auth Check Loading State
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#f4f6fa] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="w-9 h-9 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-700">Verifying session...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Display Login Page First
  if (!currentUser) {
    return (
      <>
        <LoginPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            loadAllData();
          }}
          showToast={showToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const isGuest = currentUser.role === 'guest';

  // 3. Authenticated: Render Main Admin Dashboard
  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-950 flex flex-col font-sans selection:bg-orange-500/20 selection:text-orange-900">
      {/* Top Header */}
      <Header
        dbStatus={dbStatus}
        currentUser={currentUser}
        onRefreshAll={loadAllData}
        onOpenDbSync={() => setIsDbSyncOpen(true)}
        onQuickNew={handleQuickNew}
        onLogout={handleLogout}
        onShowToast={showToast}
        isLoading={isLoading}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          stats={stats}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Guest Banner if logged in as guest */}
            {isGuest && (
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-200/80 text-sky-700 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                      <span>Guest Demo Mode Active</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-200/80 text-sky-800">
                        Read-Only
                      </span>
                    </p>
                    <p className="text-[11px] text-sky-800 mt-0.5">
                      You are previewing all dashboard collections, live database stats, and portfolio assets. All editing, deletion, and creation operations are securely disabled.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white hover:bg-sky-100 border border-sky-300 text-sky-900 text-xs font-bold shrink-0 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sign In as Admin</span>
                </button>
              </div>
            )}

            {currentTab === 'overview' && (
              <OverviewView
                stats={stats}
                certificates={certificates}
                projects={projects}
                inquiries={inquiries}
                profile={profile}
                onNavigate={setCurrentTab}
                onQuickNew={handleQuickNew}
                onOpenDbSync={() => setIsDbSyncOpen(true)}
              />
            )}

            {currentTab === 'certificates' && (
              <CertificatesView
                certificates={certificates}
                onRefresh={loadAllData}
                onShowToast={showToast}
                initialCreateOpen={quickCreateType === 'certificate'}
              />
            )}

            {currentTab === 'projects' && (
              <ProjectsView
                projects={projects}
                onRefresh={loadAllData}
                onShowToast={showToast}
                initialCreateOpen={quickCreateType === 'project'}
              />
            )}

            {currentTab === 'skills' && (
              <SkillsView
                skills={skills}
                onRefresh={loadAllData}
                onShowToast={showToast}
                initialCreateOpen={quickCreateType === 'skill'}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileView
                initialProfile={profile}
                onRefresh={loadAllData}
                onShowToast={showToast}
              />
            )}

            {currentTab === 'experiences' && (
              <ExperiencesView
                experiences={experiences}
                onRefresh={loadAllData}
                onShowToast={showToast}
                initialCreateOpen={quickCreateType === 'experience'}
              />
            )}

            {currentTab === 'inquiries' && (
              <InquiriesView
                inquiries={inquiries}
                onRefresh={loadAllData}
                onShowToast={showToast}
              />
            )}
          </div>
        </main>
      </div>

      {/* DB Sync & Diagnostics Modal */}
      <DbSyncModal
        isOpen={isDbSyncOpen}
        onClose={() => setIsDbSyncOpen(false)}
        dbStatus={dbStatus}
        onRefreshStatus={loadAllData}
        onShowToast={showToast}
      />

      {/* Toast notifications container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
