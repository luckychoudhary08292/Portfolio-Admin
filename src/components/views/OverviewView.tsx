import React from 'react';
import {
  Award,
  FolderGit2,
  Cpu,
  Inbox,
  UserCheck,
  Plus,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  StatsOverview,
  CertificateItem,
  ProjectItem,
  InquiryItem,
  ProfileData,
} from '../../types.ts';
import { NavTab } from '../Sidebar.tsx';

interface OverviewViewProps {
  stats: StatsOverview | null;
  certificates: CertificateItem[];
  projects: ProjectItem[];
  inquiries: InquiryItem[];
  profile: ProfileData | null;
  onNavigate: (tab: NavTab) => void;
  onQuickNew: (type: 'certificate' | 'project' | 'skill' | 'experience') => void;

  onOpenDbSync: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  certificates,
  projects,
  inquiries,
  profile,
  onNavigate,
  onQuickNew,
  onOpenDbSync,
}) => {
  const isConnected = stats?.dbStatus?.status === 'connected';
  const newInquiries = inquiries.filter((i) => i.status === 'new');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-200/70">
        <div>
          <h2 className="text-xl font-bold text-slate-950 tracking-tight">Overview Dashboard</h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 font-medium">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span>{isConnected ? 'Connected to MongoDB Atlas' : 'Disconnected'}</span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-slate-900 font-semibold bg-sky-100/80 px-2 py-0.5 rounded border border-sky-200/60">
              {stats?.dbStatus?.databaseName || 'portfolio'}
            </span>
            {stats?.dbStatus?.pingMs !== undefined && (
              <>
                <span className="text-slate-400">·</span>
                <span className="text-emerald-700 font-mono font-medium">{stats.dbStatus.pingMs}ms latency</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDbSync}
            className="px-3.5 py-2 rounded-xl border border-sky-200 bg-white hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 text-slate-800 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            DB Sync
          </button>
          <button
            onClick={() => onQuickNew('project')}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold shadow-sm shadow-orange-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid - Sky Blue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('projects')}
          className="p-5 rounded-2xl border border-sky-200 bg-[#f0f7ff] hover:bg-[#e8f3ff] hover:border-orange-400 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider group-hover:text-orange-600 transition-colors">
              Projects
            </div>
            <FolderGit2 className="w-4 h-4 text-sky-600 group-hover:text-orange-500 transition-colors" />
          </div>
          <div className="text-3xl font-extrabold text-slate-950 mt-2 font-mono tabular-nums">
            {stats?.counts?.projects ?? projects.length}
          </div>
          <div className="text-[11px] text-slate-600 mt-1 font-medium flex items-center gap-1 group-hover:text-orange-600">
            <span>Manage showcase</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('certificates')}
          className="p-5 rounded-2xl border border-sky-200 bg-[#f0f7ff] hover:bg-[#e8f3ff] hover:border-orange-400 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider group-hover:text-orange-600 transition-colors">
              Certificates
            </div>
            <Award className="w-4 h-4 text-sky-600 group-hover:text-orange-500 transition-colors" />
          </div>
          <div className="text-3xl font-extrabold text-slate-950 mt-2 font-mono tabular-nums">
            {stats?.counts?.certificates ?? certificates.length}
          </div>
          <div className="text-[11px] text-slate-600 mt-1 font-medium flex items-center gap-1 group-hover:text-orange-600">
            <span>Verified credentials</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('skills')}
          className="p-5 rounded-2xl border border-sky-200 bg-[#f0f7ff] hover:bg-[#e8f3ff] hover:border-orange-400 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider group-hover:text-orange-600 transition-colors">
              Skills & Categories
            </div>
            <Cpu className="w-4 h-4 text-sky-600 group-hover:text-orange-500 transition-colors" />
          </div>
          <div className="text-3xl font-extrabold text-slate-950 mt-2 font-mono tabular-nums flex items-baseline gap-2">
            <span>{stats?.counts?.skillCategories ?? 0}</span>
            <span className="text-xs font-semibold text-slate-600 font-sans">
              ({stats?.counts?.skillLibrary ?? 54} master)
            </span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1 font-medium flex items-center gap-1 group-hover:text-orange-600">
            <span>Technical stack</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('inquiries')}
          className="p-5 rounded-2xl border border-sky-200 bg-[#f0f7ff] hover:bg-[#e8f3ff] hover:border-orange-400 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider group-hover:text-orange-600 transition-colors">
              Inquiries
            </div>
            <Inbox className="w-4 h-4 text-sky-600 group-hover:text-orange-500 transition-colors" />
          </div>
          <div className="text-3xl font-extrabold text-slate-950 mt-2 font-mono tabular-nums flex items-center gap-2">
            <span>{stats?.counts?.inquiries ?? inquiries.length}</span>
            {newInquiries.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500 text-white font-sans font-semibold text-[11px] shadow-xs">
                {newInquiries.length} new
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-600 mt-1 font-medium flex items-center gap-1 group-hover:text-orange-600">
            <span>Client messages</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Main Grid: Projects Preview + Inquiries in Sky Blue Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Projects List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Featured Projects
            </h3>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs text-slate-700 hover:text-orange-600 font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <span>View all projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-[#f0f7ff] shadow-xs overflow-hidden divide-y divide-sky-100">
            {projects.slice(0, 4).map((proj) => (
              <div
                key={proj._id || proj.title}
                className="p-4 flex items-center justify-between gap-4 hover:bg-white/80 transition-all duration-150 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-white overflow-hidden shrink-0 border border-sky-200 shadow-xs">
                    <img
                      src={proj.image}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-950 truncate group-hover:text-orange-600 transition-colors">
                        {proj.title}
                      </h4>
                      {proj.featured && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-medium truncate mt-0.5">
                      {proj.subtitle || proj.category}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 font-mono font-semibold shrink-0 bg-white px-2.5 py-1 rounded-lg border border-sky-200">
                  #{proj.order}
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-600 font-medium">
                No projects found in database.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Inquiries */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Recent Inquiries
            </h3>
            <button
              onClick={() => onNavigate('inquiries')}
              className="text-xs text-slate-700 hover:text-orange-600 font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <span>Inbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-[#f0f7ff] shadow-xs overflow-hidden divide-y divide-sky-100">
            {inquiries.slice(0, 3).map((inq) => (
              <div key={inq._id || inq.name} className="p-4 space-y-1.5 hover:bg-white/80 transition-all duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-950">{inq.name || 'Anonymous'}</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-mono capitalize font-semibold ${
                      inq.status === 'new'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-white text-slate-700 border border-sky-200'
                    }`}
                  >
                    {inq.status}
                  </span>
                </div>
                {inq.company && (
                  <p className="text-xs text-slate-700 font-medium">{inq.company}</p>
                )}
                <p className="text-xs text-slate-800 leading-relaxed line-clamp-2">
                  {inq.message}
                </p>
              </div>
            ))}

            {inquiries.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-600 font-medium">
                No inquiries yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
