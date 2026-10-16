import React, { useState } from 'react';
import {
  X,
  Database,
  Check,
  Copy,
  RefreshCw,
  Download,
  Server,
  Code2,
} from 'lucide-react';
import { DbStatusInfo } from '../../types.ts';
import { api } from '../../services/api.ts';

interface DbSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: DbStatusInfo | null;
  onRefreshStatus: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const DbSyncModal: React.FC<DbSyncModalProps> = ({
  isOpen,
  onClose,
  dbStatus,
  onRefreshStatus,
  onShowToast,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schemas' | 'connect'>('overview');
  const [customUri, setCustomUri] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onShowToast('Copied', 'Copied to clipboard', 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleReconnect = async () => {
    try {
      setIsReconnecting(true);
      const res = await api.reconnect(customUri || undefined);
      if (res.success) {
        onShowToast('Connected', `Latency: ${res.pingMs ?? 0}ms`, 'success');
        onRefreshStatus();
      } else {
        onShowToast('Failed', res.error || 'Failed to connect', 'error');
      }
    } catch (e: any) {
      onShowToast('Error', e.message, 'error');
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleSeedSamples = async (force: boolean) => {
    try {
      setIsSeeding(true);
      const res = await api.seedSamples(force);
      if (res.success) {
        onShowToast('Seeded', 'Sample data populated in MongoDB', 'success');
        onRefreshStatus();
      }
    } catch (e: any) {
      onShowToast('Error', e.message, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const dump = await api.exportAll();
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast('Exported', 'Database backup downloaded', 'success');
    } catch (e: any) {
      onShowToast('Export Error', e.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const isConnected = dbStatus?.status === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-sky-200 rounded-2xl shadow-2xl flex flex-col text-slate-950 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-sky-100 bg-sky-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center">
              <Database className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-950 tracking-tight">Database & Sync</h2>
              <div className="text-[11px] text-slate-600 font-medium">Live MongoDB Status & Schemas</div>
            </div>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold border ml-1 ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-2.5 border-b border-sky-100 bg-sky-50/30 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-medium ${
              activeTab === 'overview'
                ? 'bg-orange-500 text-white font-semibold shadow-xs'
                : 'text-slate-650 hover:text-slate-950 hover:bg-white'
            }`}
          >
            Overview & Actions
          </button>
          <button
            onClick={() => setActiveTab('schemas')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-medium ${
              activeTab === 'schemas'
                ? 'bg-orange-500 text-white font-semibold shadow-xs'
                : 'text-slate-650 hover:text-slate-950 hover:bg-white'
            }`}
          >
            Schemas
          </button>
          <button
            onClick={() => setActiveTab('connect')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-medium ${
              activeTab === 'connect'
                ? 'bg-orange-500 text-white font-semibold shadow-xs'
                : 'text-slate-650 hover:text-slate-950 hover:bg-white'
            }`}
          >
            Connection
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#f0f7ff] border border-sky-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Database Name</span>
                  <span className="font-mono text-slate-950 font-bold bg-white px-2 py-0.5 rounded-md border border-sky-200/80">{dbStatus?.databaseName || 'portfolio'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Host</span>
                  <span className="font-mono text-slate-900 truncate max-w-xs">{dbStatus?.host || 'cluster0.xqhmhxd.mongodb.net'}</span>
                </div>
                {dbStatus?.pingMs !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Ping Latency</span>
                    <span className="font-mono text-emerald-600 font-semibold">{dbStatus.pingMs}ms</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <button
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="p-4 rounded-2xl border border-sky-200 bg-[#f0f7ff] hover:bg-[#e6f2ff] hover:border-orange-300 transition text-left flex items-center justify-between group cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <div>
                    <div className="font-bold text-slate-950 flex items-center gap-2 group-hover:text-orange-600 transition">
                      <Download className="w-4 h-4 text-orange-500" />
                      <span>Export JSON Backup</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 font-medium">Download all collections backup</div>
                  </div>
                </button>

                <button
                  onClick={() => handleSeedSamples(false)}
                  disabled={isSeeding}
                  className="p-4 rounded-2xl border border-sky-200 bg-[#f0f7ff] hover:bg-[#e6f2ff] hover:border-orange-300 transition text-left flex items-center justify-between group cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <div>
                    <div className="font-bold text-slate-950 flex items-center gap-2 group-hover:text-orange-600 transition">
                      <Server className="w-4 h-4 text-orange-500" />
                      <span>Seed Sample Data</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 font-medium">Populate demo entries if database is empty</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'schemas' && (
            <div className="space-y-3 font-mono text-[11px]">
              <div className="p-3.5 rounded-xl bg-[#f0f7ff] border border-sky-200 space-y-1">
                <div className="font-bold text-slate-950">1. Certificates (certificates)</div>
                <div className="text-slate-700">title, issuer, issueDate, credentialId, verifyUrl, category (Academic, Competitions, Events, Tools, Other), image, skills, order</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f0f7ff] border border-sky-200 space-y-1">
                <div className="font-bold text-slate-950">2. Projects (projects)</div>
                <div className="text-slate-700">title, subtitle, category, tag, image, description, githubUrl, liveUrl, metrics, techStack, deliverables, order, featured</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f0f7ff] border border-sky-200 space-y-1">
                <div className="font-bold text-slate-950">3. Skills (skillcategories)</div>
                <div className="text-slate-700">category, description, image, items [name, level, badge], order</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f0f7ff] border border-sky-200 space-y-1">
                <div className="font-bold text-slate-950">4. Profile (profiles)</div>
                <div className="text-slate-700">name, title, heroQuote, experienceYears, projectsCompleted, problemsSolved, gpa, degree, university, whyHireMeBio, email, phone, website, github, linkedin, leetcode, resumeUrl, heroImage, whyHireMeImage</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f0f7ff] border border-sky-200 space-y-1">
                <div className="font-bold text-slate-950">5. Experience (experiences)</div>
                <div className="text-slate-700">title, subtitle, date, place, order</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f0f7ff] border border-sky-200 space-y-1">
                <div className="font-bold text-slate-950">6. Inquiries (inquiries)</div>
                <div className="text-slate-700">name, email, company, opportunityType, message, status</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f0f7ff] border border-sky-200 space-y-1">
                <div className="font-bold text-slate-950">7. Technical Skills Library (skills)</div>
                <div className="text-slate-700">name, slug, category, badge, iconUrl, color, level, popular</div>
              </div>
            </div>
          )}

          {activeTab === 'connect' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-900">Custom MongoDB Connection URI</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="mongodb+srv://..."
                    value={customUri}
                    onChange={(e) => setCustomUri(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-mono focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                  <button
                    onClick={handleReconnect}
                    disabled={isReconnecting}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 font-semibold text-white text-xs transition cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isReconnecting ? 'Connecting...' : 'Reconnect'}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#f0f7ff] border border-sky-200 text-xs text-slate-700 space-y-1.5">
                <div className="font-bold text-slate-950">Default URI Configured:</div>
                <div className="font-mono text-slate-700 truncate bg-white p-2 rounded-lg border border-sky-200/60">
                  mongodb+srv://portfolio08292:portfolio136366@cluster0.xqhmhxd.mongodb.net/portfolio
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-sky-100 bg-sky-50/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-sky-200 hover:bg-white text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
