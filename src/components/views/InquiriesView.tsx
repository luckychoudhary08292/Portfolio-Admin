import React, { useState } from 'react';
import {
  Search,
  Mail,
  Building,
  Briefcase,
  Trash2,
  Clock,
  Plus,
  X,
  ShieldAlert,
} from 'lucide-react';
import { InquiryItem } from '../../types.ts';
import { api } from '../../services/api.ts';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal.tsx';

interface InquiriesViewProps {
  inquiries: InquiryItem[];
  onRefresh: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  isGuest?: boolean;
}

const HARDCODED_GUEST_INQUIRIES: InquiryItem[] = [
  {
    _id: 'guest-showcase-inquiry-1',
    name: 'Sarah Mitchell',
    email: 'smitchell@apextech-recruiting.com',
    company: 'Apex Innovations',
    opportunityType: 'Full-Time Software Engineer',
    message: 'Hello Lucky, our technical recruitment team came across your distributed systems projects and full-stack portfolio. We would love to schedule an introductory conversation regarding our core platform engineering team.',
    status: 'new',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    _id: 'guest-showcase-inquiry-2',
    name: 'David Vance',
    email: 'dvance@hypercloud.io',
    company: 'HyperCloud Systems',
    opportunityType: 'Contract / System Architecture',
    message: 'Hi Lucky, reviewed your DevCollab real-time editor and containerized architecture. We are currently scaling our collaborative workspace microservices and would like to explore a consulting collaboration.',
    status: 'read',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
];

export const InquiriesView: React.FC<InquiriesViewProps> = ({
  inquiries: rawInquiries,
  onRefresh,
  onShowToast,
  isGuest,
}) => {
  const inquiries = isGuest
    ? rawInquiries.length > 0
      ? rawInquiries
      : HARDCODED_GUEST_INQUIRIES
    : rawInquiries;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'replied' | 'archived'>('all');
  const [deleteTarget, setDeleteTarget] = useState<InquiryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Test Simulator State
  const [testName, setTestName] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testCompany, setTestCompany] = useState('');
  const [testOpportunity, setTestOpportunity] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  const handleUpdateStatus = async (item: InquiryItem, newStatus: 'new' | 'read' | 'replied' | 'archived') => {
    if (!item._id) return;
    if (isGuest) {
      onShowToast(
        'Guest Demo Mode (Read-Only)',
        'Inquiry status updates are disabled in guest mode. Log in as Admin to manage messages.',
        'info'
      );
      return;
    }
    try {
      await api.updateInquiryStatus(item._id, newStatus);
      onShowToast('Status Updated', `Marked as "${newStatus}"`, 'info');
      onRefresh();
    } catch (err: any) {
      onShowToast('Update Error', err.message, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !deleteTarget._id) return;
    if (isGuest) {
      onShowToast(
        'Guest Demo Mode (Read-Only)',
        'Deleting inquiries is disabled in guest mode.',
        'info'
      );
      setDeleteTarget(null);
      return;
    }
    try {
      setIsDeleting(true);
      await api.deleteInquiry(deleteTarget._id);
      onShowToast('Deleted', 'Removed inquiry', 'info');
      setDeleteTarget(null);
      onRefresh();
    } catch (err: any) {
      onShowToast('Delete Error', err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendTestInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      onShowToast(
        'Guest Demo Mode (Read-Only)',
        'Sending test inquiries is disabled in guest mode.',
        'info'
      );
      setIsTestModalOpen(false);
      return;
    }
    if (!testName || !testMessage) {
      onShowToast('Required Fields', 'Name and message are required', 'error');
      return;
    }

    try {
      setIsSubmittingTest(true);
      await api.createInquiry({
        name: testName,
        email: testEmail,
        company: testCompany,
        opportunityType: testOpportunity,
        message: testMessage,
        status: 'new',
      });
      onShowToast('Inquiry Created', 'Saved inquiry to database', 'success');
      setIsTestModalOpen(false);
      setTestName('');
      setTestEmail('');
      setTestCompany('');
      setTestOpportunity('');
      setTestMessage('');
      onRefresh();
    } catch (err: any) {
      onShowToast('Send Failed', err.message, 'error');
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const filtered = inquiries.filter((item) => {
    const matchSearch =
      (item.name && item.name.toLowerCase().includes(search.toLowerCase())) ||
      (item.company && item.company.toLowerCase().includes(search.toLowerCase())) ||
      (item.message && item.message.toLowerCase().includes(search.toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const newCount = inquiries.filter((i) => i.status === 'new').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-sky-200/70">
        <div>
          <h2 className="text-xl font-bold text-slate-950 tracking-tight flex items-center gap-2.5">
            <span>Inquiries</span>
            {newCount > 0 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 font-bold font-mono">
                {newCount} new
              </span>
            )}
          </h2>
          <div className="text-xs text-slate-700 mt-1 font-medium">
            {isGuest ? '2 demonstration inquiries (Client data protected)' : `${inquiries.length} total client messages & leads`}
          </div>
        </div>

        <button
          onClick={() => {
            if (isGuest) {
              onShowToast('Guest Demo Mode', 'Adding inquiries is disabled in guest mode.', 'info');
              return;
            }
            setIsTestModalOpen(true);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer ${
            isGuest
              ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{isGuest ? 'New Inquiry (Demo)' : 'New Inquiry'}</span>
        </button>
      </div>

      {/* Recruiter Privacy Showcase Banner */}
      {isGuest && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-900">
              Recruiter Demo Mode • 2 Hardcoded Showcase Inquiries
            </p>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
              Real client messages contain confidential contact information and are strictly restricted to the Admin account. 
              Below are 2 demonstration inquiries showing how incoming opportunities, status filters, and message reviews are handled.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search inquiries by name, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-xs transition"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs p-1 bg-sky-100/60 border border-sky-200/80 rounded-xl">
          {(['all', 'new', 'read', 'replied', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg capitalize text-xs font-medium transition cursor-pointer ${
                statusFilter === s
                  ? 'bg-orange-500 text-white font-semibold shadow-xs'
                  : 'text-slate-650 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries List */}
      <div className="space-y-3.5">
        {filtered.map((item) => (
          <div
            key={item._id || item.email}
            className={`rounded-2xl border p-5 transition-all duration-200 flex flex-col md:flex-row md:items-start justify-between gap-4 ${
              item.status === 'new'
                ? 'bg-[#eef6ff] border-orange-300 shadow-sm ring-1 ring-orange-400/20'
                : 'bg-[#f0f7ff] border-sky-200/90 shadow-xs hover:border-orange-300 hover:shadow-md'
            }`}
          >
            <div className="space-y-2.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                    item.status === 'new'
                      ? 'bg-orange-100 text-orange-700 border-orange-300 font-bold'
                      : item.status === 'replied'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
                      : 'bg-white text-slate-700 border-sky-200 font-medium'
                  }`}
                >
                  {item.status}
                </span>

                {item.createdAt && (
                  <span className="text-[11px] text-slate-700 font-mono flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-950 tracking-tight">
                  {item.name || 'Anonymous'}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 mt-1 font-medium">
                  {item.email && (
                    <span className="font-mono text-slate-800 bg-white/70 px-2 py-0.5 rounded-md border border-sky-200/60">
                      {item.email}
                    </span>
                  )}
                  {item.company && (
                    <span className="flex items-center gap-1 text-slate-800">
                      <Building className="w-3.5 h-3.5 text-sky-600" />
                      {item.company}
                    </span>
                  )}
                  {item.opportunityType && (
                    <span className="flex items-center gap-1 text-slate-800">
                      <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                      {item.opportunityType}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-sky-200/80 text-xs text-slate-900 leading-relaxed whitespace-pre-line shadow-2xs font-normal">
                {item.message || 'No message content.'}
              </div>
            </div>

            {/* Actions */}
            <div className="flex md:flex-col items-center justify-between md:items-end gap-2.5 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-sky-200/80">
              {item.email && (
                <a
                  href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.opportunityType || 'Inquiry')}`}
                  onClick={() => {
                    if (item.status === 'new') handleUpdateStatus(item, 'replied');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 text-orange-700 text-xs font-semibold shadow-2xs transition"
                >
                  <Mail className="w-3.5 h-3.5 text-orange-500" />
                  <span>Email Reply</span>
                </a>
              )}

              <div className="flex items-center gap-1.5 text-xs">
                <select
                  value={item.status || 'new'}
                  onChange={(e) => handleUpdateStatus(item, e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-sky-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-orange-500 shadow-2xs cursor-pointer"
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="archived">Archived</option>
                </select>

                <button
                  onClick={() => setDeleteTarget(item)}
                  className="p-1.5 rounded-xl border border-transparent hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-10 text-center rounded-2xl border-2 border-dashed border-sky-200 bg-white/50 text-xs text-slate-700">
          No inquiries found.
        </div>
      )}

      {/* CREATE / TEST MODAL */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-sky-200 rounded-2xl shadow-2xl flex flex-col text-slate-950 my-8 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-sky-100 bg-sky-50/50">
              <h3 className="text-base font-bold text-slate-950">New Inquiry</h3>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendTestInquiry} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-900">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Sender name"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-900">Email</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-900">Company</label>
                  <input
                    type="text"
                    placeholder="Company or org"
                    value={testCompany}
                    onChange={(e) => setTestCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-900">Opportunity Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Full-Time / Internship"
                    value={testOpportunity}
                    onChange={(e) => setTestOpportunity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-900">Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Inquiry message..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-sky-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-sky-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTest}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isSubmittingTest ? 'Submitting...' : 'Save Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Inquiry"
        itemName={deleteTarget?.name || 'this inquiry'}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

