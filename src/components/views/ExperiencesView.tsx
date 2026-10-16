import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  X,
  Search,
  Calendar,
  MapPin,
} from 'lucide-react';
import { ExperienceItem } from '../../types.ts';
import { api } from '../../services/api.ts';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal.tsx';

interface ExperiencesViewProps {
  experiences: ExperienceItem[];
  onRefresh: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  initialCreateOpen?: boolean;
}

export const ExperiencesView: React.FC<ExperiencesViewProps> = ({
  experiences,
  onRefresh,
  onShowToast,
  initialCreateOpen,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(initialCreateOpen || false);
  const [editingItem, setEditingItem] = useState<ExperienceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExperienceItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State: exactly title, subtitle, date, place, order
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formPlace, setFormPlace] = useState('');
  const [formOrder, setFormOrder] = useState<number>(1);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormDate('');
    setFormPlace('');
    setFormOrder(experiences.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ExperienceItem) => {
    setEditingItem(item);
    setFormTitle(item.title || item.role || '');
    setFormSubtitle(item.subtitle || item.company || '');
    setFormDate(item.date || item.period || '');
    setFormPlace(item.place || item.location || '');
    setFormOrder(item.order ?? 0);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (item: ExperienceItem) => {
    try {
      const currentTitle = item.title || item.role || 'Experience';
      const payload: Partial<ExperienceItem> = {
        title: `${currentTitle} (Copy)`,
        subtitle: item.subtitle || item.company || '',
        date: item.date || item.period || '',
        place: item.place || item.location || '',
        order: (item.order || 0) + 1,
      };
      await api.createExperience(payload);
      onShowToast('Duplicated', `Created copy of ${currentTitle}`, 'success');
      onRefresh();
    } catch (e: any) {
      onShowToast('Duplicate Error', e.message, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      onShowToast('Required Field', 'Title is required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<ExperienceItem> = {
        title: formTitle.trim(),
        subtitle: formSubtitle.trim(),
        date: formDate.trim(),
        place: formPlace.trim(),
        order: Number(formOrder) || 0,
      };

      if (editingItem && editingItem._id) {
        await api.updateExperience(editingItem._id, payload);
        onShowToast('Saved', `Updated "${formTitle}"`, 'success');
      } else {
        await api.createExperience(payload);
        onShowToast('Created', `Added "${formTitle}"`, 'success');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      onShowToast('Save Error', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !deleteTarget._id) return;
    try {
      setIsDeleting(true);
      await api.deleteExperience(deleteTarget._id);
      const title = deleteTarget.title || deleteTarget.role || 'Entry';
      onShowToast('Deleted', `Removed "${title}"`, 'info');
      setDeleteTarget(null);
      onRefresh();
    } catch (err: any) {
      onShowToast('Delete Error', err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShiftOrder = async (item: ExperienceItem, delta: number) => {
    if (!item._id) return;
    try {
      const newOrder = Math.max(0, (item.order || 0) + delta);
      await api.updateExperience(item._id, { order: newOrder });
      onRefresh();
    } catch (err: any) {
      onShowToast('Reorder Error', err.message, 'error');
    }
  };

  const filtered = experiences.filter((e) => {
    const title = (e.title || e.role || '').toLowerCase();
    const subtitle = (e.subtitle || e.company || '').toLowerCase();
    const date = (e.date || e.period || '').toLowerCase();
    const place = (e.place || e.location || '').toLowerCase();
    const q = search.toLowerCase();

    return (
      title.includes(q) ||
      subtitle.includes(q) ||
      date.includes(q) ||
      place.includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-sky-200/70">
        <div>
          <h2 className="text-xl font-bold text-slate-950 tracking-tight">Experience & Career Journey</h2>
          <div className="text-xs text-slate-600 font-medium mt-1">
            {experiences.length} total entries · Schema: Title, Subtitle, Date, Place
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold shadow-sm shadow-orange-500/25 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Entry</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, subtitle, date, or place..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs transition"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-orange-600 hover:text-orange-700 font-bold transition cursor-pointer"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* List - Sky Blue Cards */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const displayTitle = item.title || item.role || 'Untitled';
          const displaySubtitle = item.subtitle || item.company || '';
          const displayDate = item.date || item.period || '';
          const displayPlace = item.place || item.location || '';

          return (
            <div
              key={item._id || displayTitle + displaySubtitle}
              className="rounded-2xl border border-sky-200 bg-[#f0f7ff] hover:border-orange-300 hover:shadow-md p-5 transition-all duration-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-xs group"
            >
              <div className="space-y-2 min-w-0 flex-1">
                {/* Title & Subtitle */}
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-950 tracking-tight group-hover:text-orange-600 transition-colors">
                    {displayTitle}
                  </h3>
                  {displaySubtitle && (
                    <>
                      <span className="text-slate-400 font-bold">·</span>
                      <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-sky-200 shadow-2xs">
                        {displaySubtitle}
                      </span>
                    </>
                  )}
                </div>

                {/* Date & Place */}
                <div className="text-xs flex flex-wrap items-center gap-2.5 pt-1">
                  {displayDate && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-sky-200 text-slate-900 font-semibold shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-orange-500" />
                      <span>{displayDate}</span>
                    </span>
                  )}
                  {displayPlace && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-sky-200 text-slate-800 font-medium shadow-2xs">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      <span>{displayPlace}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Order & Actions */}
              <div className="flex items-center gap-2.5 self-end sm:self-start shrink-0">
                <div className="flex items-center gap-1 bg-white border border-sky-200 rounded-lg px-2 py-0.5 text-xs text-slate-800 font-mono font-bold shadow-xs">
                  <span>#{item.order ?? 0}</span>
                  <button onClick={() => handleShiftOrder(item, -1)} className="hover:text-orange-600 p-0.5 cursor-pointer" title="Move Up">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleShiftOrder(item, 1)} className="hover:text-orange-600 p-0.5 cursor-pointer" title="Move Down">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(item)}
                    className="p-1.5 rounded-lg border border-sky-200 bg-white text-slate-700 hover:text-orange-600 hover:bg-orange-50 shadow-xs transition cursor-pointer"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg border border-sky-200 bg-white text-slate-700 hover:text-orange-600 hover:bg-orange-50 shadow-xs transition cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 rounded-lg border border-sky-200 bg-white text-slate-700 hover:text-rose-600 hover:bg-rose-50 shadow-xs transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-dashed border-sky-300 bg-[#f0f7ff] text-xs text-slate-600 font-medium">
          No experience items found.
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-sky-200 rounded-2xl shadow-2xl flex flex-col text-slate-950 my-8 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-sky-100 bg-[#f0f7ff]">
              <h3 className="text-base font-bold text-slate-950">
                {editingItem ? 'Edit Experience Entry' : 'New Experience Entry'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-600 hover:text-orange-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] text-xs">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineer or B.Tech Computer Science"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Company name or College / Institution"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                />
              </div>

              {/* Date & Place Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Date</label>
                  <input
                    type="text"
                    placeholder="e.g. June 2024 - Sep 2024 or 2022"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Place</label>
                  <input
                    type="text"
                    placeholder="e.g. Indore or Remote / Bengaluru"
                    value={formPlace}
                    onChange={(e) => setFormPlace(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                  />
                </div>
              </div>

              {/* Order */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900">Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={formOrder}
                  onChange={(e) => setFormOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium font-mono focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="pt-4 border-t border-sky-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-sky-200 hover:bg-sky-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Experience Entry"
        itemName={deleteTarget ? `${deleteTarget.title || deleteTarget.role || 'Entry'}` : ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

