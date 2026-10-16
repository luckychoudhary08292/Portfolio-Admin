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
  Sparkles,
  Layers,
  RefreshCw,
  FolderKanban,
  Tag,
} from 'lucide-react';
import { SkillCategoryItem, SkillItem, SkillLibraryItem } from '../../types.ts';
import { api } from '../../services/api.ts';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal.tsx';
import { ImageUploadField } from '../ImageUploadField.tsx';
import { SkillSearchPicker } from '../SkillSearchPicker.tsx';

interface SkillsViewProps {
  skills: SkillCategoryItem[];
  onRefresh: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  initialCreateOpen?: boolean;
}

export const SkillsView: React.FC<SkillsViewProps> = ({
  skills,
  onRefresh,
  onShowToast,
  initialCreateOpen,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'library'>('categories');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(initialCreateOpen || false);
  const [editingCategory, setEditingCategory] = useState<SkillCategoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SkillCategoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isManageCatsModalOpen, setIsManageCatsModalOpen] = useState(false);

  // Quick Add To Category state
  const [quickAddCategory, setQuickAddCategory] = useState<SkillCategoryItem | null>(null);

  // Form State for Category Modal
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formItems, setFormItems] = useState<SkillItem[]>([]);

  // Manual fallback inputs
  const [manualName, setManualName] = useState('');
  const [manualLevel, setManualLevel] = useState('Proficient');
  const [manualBadge, setManualBadge] = useState('');

  // Skill Library Tab state
  const [librarySkills, setLibrarySkills] = useState<SkillLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryFilterCat, setLibraryFilterCat] = useState('all');
  const [isNewLibraryModalOpen, setIsNewLibraryModalOpen] = useState(false);
  const [editingLibSkill, setEditingLibSkill] = useState<SkillLibraryItem | null>(null);
  const [deleteLibTarget, setDeleteLibTarget] = useState<SkillLibraryItem | null>(null);

  // Form state for Library Skill
  const [libName, setLibName] = useState('');
  const [libCategory, setLibCategory] = useState('Languages');
  const [libBadge, setLibBadge] = useState('');
  const [libIconUrl, setLibIconUrl] = useState('');
  const [libColor, setLibColor] = useState('#3b82f6');
  const [libLevel, setLibLevel] = useState('Proficient');
  const [libPopular, setLibPopular] = useState(true);

  // Fetch skill library items when tab is opened
  const fetchLibrary = async () => {
    try {
      setLibraryLoading(true);
      const data = await api.getSkillLibrary();
      setLibrarySkills(data);
    } catch (err: any) {
      onShowToast('Error', err.message, 'error');
    } finally {
      setLibraryLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLibrary();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormCategory('');
    setFormDescription('');
    setFormImage('');
    setFormOrder(skills.length + 1);
    setFormItems([]);
    setManualName('');
    setManualBadge('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: SkillCategoryItem) => {
    setEditingCategory(cat);
    setFormCategory(cat.category);
    setFormDescription(cat.description || '');
    setFormImage(cat.image || '');
    setFormOrder(cat.order ?? 0);
    setFormItems(cat.items ? [...cat.items] : []);
    setManualName('');
    setManualBadge('');
    setIsModalOpen(true);
  };

  // Select skill from Library Picker inside modal
  const handlePickerSelect = (skill: SkillItem) => {
    // Avoid exact duplicate in category
    if (formItems.some((i) => i.name.toLowerCase() === skill.name.toLowerCase())) {
      onShowToast('Already Added', `"${skill.name}" is already in this category`, 'info');
      return;
    }
    setFormItems([...formItems, skill]);
  };

  // Direct Quick Add from Category Card on main page
  const handleQuickAddDirect = async (targetCat: SkillCategoryItem, skill: SkillItem) => {
    if (!targetCat._id) return;
    const currentItems = targetCat.items || [];
    if (currentItems.some((i) => i.name.toLowerCase() === skill.name.toLowerCase())) {
      onShowToast('Already Added', `"${skill.name}" is already in ${targetCat.category}`, 'info');
      return;
    }

    try {
      const updatedItems = [...currentItems, skill];
      await api.updateSkillCategory(targetCat._id, { items: updatedItems });
      onShowToast('Skill Added', `Added "${skill.name}" to ${targetCat.category}`, 'success');
      setQuickAddCategory(null);
      onRefresh();
    } catch (err: any) {
      onShowToast('Add Error', err.message, 'error');
    }
  };

  const handleManualAdd = () => {
    const trimmed = manualName.trim();
    if (!trimmed) return;
    setFormItems([
      ...formItems,
      {
        name: trimmed,
        level: manualLevel.trim() || 'Proficient',
        badge: manualBadge.trim().toLowerCase() || trimmed.toLowerCase().slice(0, 5),
      },
    ]);
    setManualName('');
    setManualBadge('');
  };

  const handleRemoveItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleDuplicate = async (cat: SkillCategoryItem) => {
    try {
      const payload: Partial<SkillCategoryItem> = {
        category: `${cat.category} (Copy)`,
        description: cat.description,
        image: cat.image,
        items: [...cat.items],
        order: (cat.order || 0) + 1,
      };
      await api.createSkillCategory(payload);
      onShowToast('Duplicated', `Created copy of ${cat.category}`, 'success');
      onRefresh();
    } catch (e: any) {
      onShowToast('Duplicate Error', e.message, 'error');
    }
  };

  const handleShiftOrder = async (cat: SkillCategoryItem, delta: number) => {
    if (!cat._id) return;
    try {
      const newOrder = Math.max(0, (cat.order || 0) + delta);
      await api.updateSkillCategory(cat._id, { order: newOrder });
      onRefresh();
    } catch (err: any) {
      onShowToast('Reorder Error', err.message, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategory) {
      onShowToast('Required Field', 'Category name is required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<SkillCategoryItem> = {
        category: formCategory,
        description: formDescription,
        image: formImage,
        order: Number(formOrder),
        items: formItems,
      };

      if (editingCategory && editingCategory._id) {
        await api.updateSkillCategory(editingCategory._id, payload);
        onShowToast('Saved', `Updated "${formCategory}"`, 'success');
      } else {
        await api.createSkillCategory(payload);
        onShowToast('Created', `Added "${formCategory}"`, 'success');
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
      await api.deleteSkillCategory(deleteTarget._id);
      onShowToast('Deleted', `Removed "${deleteTarget.category}"`, 'info');
      setDeleteTarget(null);
      onRefresh();
    } catch (err: any) {
      onShowToast('Delete Error', err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Library Skill Modal Handlers
  const openNewLibrarySkill = () => {
    setEditingLibSkill(null);
    setLibName('');
    setLibCategory('Languages');
    setLibBadge('');
    setLibIconUrl('');
    setLibColor('#3b82f6');
    setLibLevel('Proficient');
    setLibPopular(true);
    setIsNewLibraryModalOpen(true);
  };

  const openEditLibrarySkill = (skill: SkillLibraryItem) => {
    setEditingLibSkill(skill);
    setLibName(skill.name);
    setLibCategory(skill.category || 'General');
    setLibBadge(skill.badge || '');
    setLibIconUrl(skill.iconUrl || '');
    setLibColor(skill.color || '#3b82f6');
    setLibLevel(skill.level || 'Proficient');
    setLibPopular(Boolean(skill.popular));
    setIsNewLibraryModalOpen(true);
  };

  const handleSaveLibrarySkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libName.trim()) {
      onShowToast('Required Field', 'Skill name is required', 'error');
      return;
    }

    const slug = libName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const badge = libBadge.trim() || slug.replace(/-/g, '');
    const iconUrl =
      libIconUrl.trim() ||
      `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${badge}/${badge}-original.svg`;

    const payload: Partial<SkillLibraryItem> = {
      name: libName.trim(),
      slug,
      category: libCategory.trim() || 'General',
      badge,
      iconUrl,
      color: libColor,
      level: libLevel,
      popular: libPopular,
    };

    try {
      setIsSaving(true);
      if (editingLibSkill && editingLibSkill._id) {
        await api.updateSkillLibraryItem(editingLibSkill._id, payload);
        onShowToast('Updated', `Updated ${libName} in skills library`, 'success');
      } else {
        await api.createSkillLibraryItem(payload);
        onShowToast('Created', `Added ${libName} to skills library`, 'success');
      }
      setIsNewLibraryModalOpen(false);
      fetchLibrary();
    } catch (err: any) {
      onShowToast('Save Error', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLibrarySkill = async () => {
    if (!deleteLibTarget || !deleteLibTarget._id) return;
    try {
      setIsDeleting(true);
      await api.deleteSkillLibraryItem(deleteLibTarget._id);
      onShowToast('Deleted', `Removed ${deleteLibTarget.name} from library`, 'info');
      setDeleteLibTarget(null);
      fetchLibrary();
    } catch (err: any) {
      onShowToast('Delete Error', err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetSeedLibrary = async () => {
    if (!confirm('Reset skills library to default collection of 54+ technical skills with logos?')) return;
    try {
      setLibraryLoading(true);
      await api.seedSkillLibrary(true);
      onShowToast('Library Reset', 'Loaded official technical skills collection', 'success');
      fetchLibrary();
    } catch (err: any) {
      onShowToast('Reset Error', err.message, 'error');
    } finally {
      setLibraryLoading(false);
    }
  };

  // Filter Categories on main page
  const filteredCategories = skills.filter((s) => {
    return (
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(search.toLowerCase()) ||
      s.items?.some((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    );
  });

  // Filter Skills Library tab
  const filteredLibrary = librarySkills.filter((s) => {
    const matchCat =
      libraryFilterCat === 'all' ||
      (s.category || '').toLowerCase() === libraryFilterCat.toLowerCase();
    const matchQuery =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      s.badge.toLowerCase().includes(search.toLowerCase()) ||
      (s.category || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header with Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-200/70">
        <div>
          <h2 className="text-xl font-bold text-slate-950 tracking-tight">Skills & Tech Stack</h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 font-medium">
            <span>{skills.length} portfolio blocks</span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-slate-900 font-semibold bg-sky-100/80 px-2 py-0.5 rounded border border-sky-200/60">
              {librarySkills.length} master skills in DB
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-[#f0f7ff] border border-sky-200 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/20'
                  : 'text-slate-800 hover:text-orange-600'
              }`}
            >
              Portfolio Blocks
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/20'
                  : 'text-slate-800 hover:text-orange-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Skills Catalog</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                activeTab === 'library' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'
              }`}>
                {librarySkills.length}
              </span>
            </button>
          </div>

          {activeTab === 'categories' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsManageCatsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-sky-200 hover:border-orange-300 hover:text-orange-700 text-slate-800 text-xs font-semibold shadow-xs transition-all cursor-pointer"
                title="Manage all skill categories"
              >
                <FolderKanban className="w-3.5 h-3.5 text-orange-500" />
                <span>Manage Categories</span>
              </button>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold shadow-sm shadow-orange-500/25 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Category</span>
              </button>
            </div>
          ) : (
            <button
              onClick={openNewLibrarySkill}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold shadow-sm shadow-orange-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Master Skill</span>
            </button>
          )}
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="max-w-md relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={
              activeTab === 'categories'
                ? 'Search categories or technologies...'
                : 'Search master skills (Java, C++, React, Docker, SQL)...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs transition"
          />
        </div>

        {activeTab === 'library' && (
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1 sm:pb-0">
            <button
              onClick={() => setLibraryFilterCat('all')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                libraryFilterCat === 'all'
                  ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                  : 'bg-white border-sky-200 text-slate-800 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              All Categories
            </button>
            {['Languages', 'Frontend', 'Backend', 'Database', 'DevOps & Cloud', 'Tools'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setLibraryFilterCat(cat)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    libraryFilterCat === cat
                      ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                      : 'bg-white border-sky-200 text-slate-800 hover:border-orange-300 hover:text-orange-600'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
            <button
              onClick={handleResetSeedLibrary}
              title="Reset / re-sync standard 54 skills"
              className="p-2 rounded-xl border border-sky-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-700 hover:text-orange-600 shadow-xs transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: PORTFOLIO CATEGORIES - Sky Blue Cards */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCategories.map((cat) => (
            <div
              key={cat._id || cat.category}
              className="rounded-2xl border border-sky-200 bg-[#f0f7ff] hover:border-orange-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs group"
            >
              <div>
                {cat.image && (
                  <div className="h-32 w-full bg-white overflow-hidden border-b border-sky-200">
                    <img src={cat.image} alt={cat.category} className="w-full h-full object-cover group-hover:scale-102 transition-transform" />
                  </div>
                )}

                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-950 tracking-tight">
                        {cat.category}
                      </h3>
                      {cat.description && (
                        <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">{cat.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-sky-200 rounded-lg px-2 py-0.5 text-xs text-slate-700 font-mono font-semibold shrink-0 shadow-xs">
                      <span>#{cat.order ?? 0}</span>
                      <button onClick={() => handleShiftOrder(cat, -1)} className="hover:text-orange-600 p-0.5 cursor-pointer">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleShiftOrder(cat, 1)} className="hover:text-orange-600 p-0.5 cursor-pointer">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Skills badges with logos */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {cat.items && cat.items.length > 0 ? (
                      cat.items.map((item, idx) => {
                        const iconSrc =
                          item.iconUrl ||
                          (item.badge
                            ? `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${item.badge}/${item.badge}-original.svg`
                            : undefined);

                        return (
                          <div
                            key={idx}
                            className="px-3 py-1.5 rounded-xl bg-white border border-sky-200 shadow-xs flex items-center gap-2 text-xs font-bold text-slate-950 hover:border-orange-300 transition-colors"
                          >
                            {iconSrc && (
                              <img
                                src={iconSrc}
                                alt={item.name}
                                className="w-4 h-4 object-contain shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            )}
                            <span>{item.name}</span>
                            {item.level && (
                              <span className="text-[10px] text-slate-600 font-normal">
                                · {item.level}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-600 font-medium">No skills added yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Card Bar: Quick Add Skill + Actions */}
              <div className="p-3.5 border-t border-sky-200/80 bg-white/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-700 font-bold text-[11px]">
                    {cat.items?.length || 0} skills
                  </span>
                  <button
                    onClick={() => setQuickAddCategory(cat)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800 text-[11px] font-bold transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Skill</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(cat)}
                    className="p-1.5 rounded-lg text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 rounded-lg text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="p-1.5 rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="col-span-2 p-12 text-center rounded-2xl border border-dashed border-sky-300 bg-[#f0f7ff] text-xs text-slate-600 font-medium">
              No skill categories found.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MASTER SKILLS COLLECTION (DB Catalog with Badges & Logos) - Sky Blue Cards */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {filteredLibrary.map((skill) => (
              <div
                key={skill._id || skill.slug}
                className="group relative p-3.5 rounded-2xl border border-sky-200 bg-[#f0f7ff] hover:bg-white hover:border-orange-400 hover:shadow-md transition-all flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-white border border-sky-200 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-xs">
                      {skill.iconUrl ? (
                        <img
                          src={skill.iconUrl}
                          alt={skill.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {skill.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                      <button
                        onClick={() => openEditLibrarySkill(skill)}
                        className="p-1 text-slate-600 hover:text-orange-600 cursor-pointer"
                        title="Edit Skill"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setDeleteLibTarget(skill)}
                        className="p-1 text-slate-600 hover:text-rose-600 cursor-pointer"
                        title="Delete Skill"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-950 tracking-tight truncate">
                      {skill.name}
                    </h4>
                    <div className="text-[10px] text-slate-700 font-medium flex items-center gap-1 mt-0.5 truncate">
                      <span>{skill.category}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-sky-100 flex items-center justify-between text-[10px] text-slate-600 font-mono">
                  <span>icon: {skill.badge}</span>
                  {skill.popular && (
                    <span className="text-orange-500 font-bold">★</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredLibrary.length === 0 && (
            <div className="p-12 text-center rounded-2xl border border-dashed border-sky-300 bg-[#f0f7ff] text-xs text-slate-600 space-y-3">
              <div>No skills found in database collection matching "{search}".</div>
              <button
                onClick={openNewLibrarySkill}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs"
              >
                Add "{search}" to Collection
              </button>
            </div>
          )}
        </div>
      )}

      {/* QUICK ADD MODAL FROM SPECIFIC CATEGORY CARD */}
      {quickAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-sky-200 rounded-2xl shadow-2xl flex flex-col text-slate-950 my-8 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-sky-100 bg-[#f0f7ff]">
              <div>
                <h3 className="text-sm font-bold text-slate-950">
                  Add Skill to "{quickAddCategory.category}"
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Type any technical skill to search and add immediately with its official badge
                </p>
              </div>
              <button
                onClick={() => setQuickAddCategory(null)}
                className="p-1 text-slate-600 hover:text-orange-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <SkillSearchPicker
                onSelectSkill={(skill) => handleQuickAddDirect(quickAddCategory, skill)}
                existingSkillNames={(quickAddCategory.items || []).map((i) => i.name)}
                placeholder="Search Java, C++, Node.js, Python, React, Docker..."
              />

              {/* Current items preview */}
              <div className="space-y-1.5 pt-2 border-t border-sky-100">
                <span className="text-xs text-slate-700 block font-bold">
                  Current Skills in this block ({quickAddCategory.items?.length || 0}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                  {quickAddCategory.items?.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-xs text-slate-900 font-semibold"
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setQuickAddCategory(null)}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white border border-sky-200 rounded-2xl shadow-2xl flex flex-col text-slate-950 my-8 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-sky-100 bg-[#f0f7ff]">
              <h3 className="text-base font-bold text-slate-950">
                {editingCategory ? 'Edit Skill Category' : 'New Skill Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-600 hover:text-orange-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-bold text-slate-900">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Programming Languages / Backend Systems"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-900">Description</label>
                <input
                  type="text"
                  placeholder="Short description of this skill category"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                />
              </div>

              {/* Banner Image with System Upload */}
              <ImageUploadField
                label="Banner Image (Optional)"
                value={formImage}
                onChange={setFormImage}
                onShowToast={onShowToast}
                placeholder="Image URL or upload from system"
              />

              {/* LIVE SKILL SEARCH & PICKER */}
              <div className="space-y-2.5 pt-3 border-t border-sky-100">
                <SkillSearchPicker
                  onSelectSkill={handlePickerSelect}
                  existingSkillNames={formItems.map((i) => i.name)}
                  placeholder="Search technical skills (Java, C++, Node.js, Python)..."
                />

                {/* Manual Add Accordion/Fallback */}
                <details className="text-slate-700 group">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-orange-600 select-none">
                    + Or enter custom skill manually
                  </summary>
                  <div className="mt-2 p-3 rounded-xl bg-sky-50 border border-sky-200 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Skill Name"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-sky-200 text-xs text-slate-950"
                      />
                      <input
                        type="text"
                        placeholder="Level (e.g. Proficient)"
                        value={manualLevel}
                        onChange={(e) => setManualLevel(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-sky-200 text-xs text-slate-950"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Devicon slug"
                          value={manualBadge}
                          onChange={(e) => setManualBadge(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-sky-200 text-xs text-slate-950 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleManualAdd}
                          className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </details>

                {/* Selected Skills List in Category */}
                <div className="space-y-2 pt-2">
                  <label className="font-bold text-slate-900 block">
                    Skills in this Category ({formItems.length})
                  </label>

                  {formItems.length === 0 ? (
                    <div className="p-5 text-center rounded-xl border border-dashed border-sky-300 bg-sky-50 text-slate-600 text-xs">
                      No skills added yet. Use the search picker above to add skills.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {formItems.map((item, idx) => {
                        const iconSrc =
                          item.iconUrl ||
                          (item.badge
                            ? `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${item.badge}/${item.badge}-original.svg`
                            : undefined);

                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              {iconSrc && (
                                <img
                                  src={iconSrc}
                                  alt={item.name}
                                  className="w-4 h-4 object-contain shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <span className="font-bold text-slate-950">{item.name}</span>
                              <span className="text-[11px] text-slate-600">({item.level || 'Proficient'})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-500 hover:text-rose-600 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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
                  {isSaving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MASTER SKILL IN LIBRARY */}
      {isNewLibraryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-md bg-white border border-sky-200 rounded-2xl shadow-2xl flex flex-col text-slate-950 my-8 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-sky-100 bg-[#f0f7ff]">
              <h3 className="text-base font-bold text-slate-950">
                {editingLibSkill ? 'Edit Skill in Catalog' : 'Add New Skill to Catalog'}
              </h3>
              <button
                onClick={() => setIsNewLibraryModalOpen(false)}
                className="p-1 text-slate-600 hover:text-orange-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLibrarySkill} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900">Skill Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kotlin or Apache Kafka"
                  value={libName}
                  onChange={(e) => setLibName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Category</label>
                  <select
                    value={libCategory}
                    onChange={(e) => setLibCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium focus:outline-hidden focus:border-orange-500"
                  >
                    <option value="Languages">Languages</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Database">Database</option>
                    <option value="DevOps & Cloud">DevOps & Cloud</option>
                    <option value="Tools">Tools</option>
                    <option value="AI & ML">AI & ML</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Badge Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. java / cplusplus"
                    value={libBadge}
                    onChange={(e) => setLibBadge(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-mono focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-900">Icon / Logo SVG URL</label>
                <input
                  type="text"
                  placeholder="https://... or leave empty for auto-generated Devicon"
                  value={libIconUrl}
                  onChange={(e) => setLibIconUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="popularCheck"
                  checked={libPopular}
                  onChange={(e) => setLibPopular(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500/30"
                />
                <label htmlFor="popularCheck" className="text-slate-800 font-medium cursor-pointer">
                  Feature in quick search recommendations
                </label>
              </div>

              <div className="pt-4 border-t border-sky-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewLibraryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-sky-200 hover:bg-sky-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingLibSkill ? 'Save Changes' : 'Add to Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE SKILL CATEGORIES MODAL */}
      {isManageCatsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-sky-200 rounded-2xl shadow-2xl p-6 text-slate-950 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-sky-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Manage Skill Categories</h3>
                  <div className="text-[11px] text-slate-600 font-medium">{skills.length} categories configured in portfolio</div>
                </div>
              </div>
              <button
                onClick={() => setIsManageCatsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick action button to create */}
            <div className="py-4 border-b border-sky-100 flex items-center justify-between">
              <span className="text-xs text-slate-700 font-medium">Create a new category block for your portfolio</span>
              <button
                type="button"
                onClick={() => {
                  setIsManageCatsModalOpen(false);
                  openCreateModal();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Category</span>
              </button>
            </div>

            {/* Categories list */}
            <div className="py-4 space-y-2.5 max-h-80 overflow-y-auto">
              {skills.map((cat) => (
                <div
                  key={cat._id || cat.category}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#f0f7ff] border border-sky-200 hover:border-orange-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Tag className="w-4 h-4 text-orange-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-950 truncate">{cat.category}</div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        {cat.items?.length || 0} skills included
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsManageCatsModalOpen(false);
                        openEditModal(cat);
                      }}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsManageCatsModalOpen(false);
                        setDeleteTarget(cat);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-sky-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageCatsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-sky-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATIONS */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Skill Category"
        itemName={deleteTarget?.category || ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteLibTarget)}
        title="Delete Master Skill from Library"
        itemName={deleteLibTarget?.name || ''}
        isDeleting={isDeleting}
        onConfirm={handleDeleteLibrarySkill}
        onCancel={() => setDeleteLibTarget(null)}
      />
    </div>
  );
};
