import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  X,
  Tag,
  FolderKanban,
  Layers,
  LayoutGrid,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { CertificateItem, CertificateCategory } from '../../types.ts';
import { api } from '../../services/api.ts';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal.tsx';
import { ImageUploadField } from '../ImageUploadField.tsx';

interface CertificatesViewProps {
  certificates: CertificateItem[];
  onRefresh: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  initialCreateOpen?: boolean;
}

export const DEFAULT_CERTIFICATE_CATEGORIES = [
  'Academic',
  'Competitions',
  'Events',
  'Tools',
  'Other',
];

export function normalizeCertificateCategory(category?: string): string {
  if (!category) return 'Other';
  const trimmed = category.trim();
  return trimmed || 'Other';
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  certificates,
  onRefresh,
  onShowToast,
  initialCreateOpen,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'grouped' | 'grid'>('grouped');

  const [isModalOpen, setIsModalOpen] = useState(initialCreateOpen || false);
  const [editingCert, setEditingCert] = useState<CertificateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CertificateItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Category Management State
  const [dbCategories, setDbCategories] = useState<{ name: string; count: number }[]>([]);
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
  const [deleteCatTarget, setDeleteCatTarget] = useState<string | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formIssuer, setFormIssuer] = useState('');
  const [formIssueDate, setFormIssueDate] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Academic');
  const [formCredentialId, setFormCredentialId] = useState('');
  const [formVerifyUrl, setFormVerifyUrl] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [formOrder, setFormOrder] = useState<number>(1);

  // Fetch categories from database
  const loadCategories = React.useCallback(() => {
    api
      .getCertificateCategories()
      .then((cats) => {
        if (Array.isArray(cats)) setDbCategories(cats);
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories, certificates]);

  // All combined categories
  const allCategoriesList = useMemo(() => {
    const map = new Map<string, number>();
    // Default categories
    DEFAULT_CERTIFICATE_CATEGORIES.forEach((name) => {
      map.set(name, 0);
    });
    // DB categories
    dbCategories.forEach((c) => {
      map.set(c.name, c.count || 0);
    });
    // From certificates
    certificates.forEach((c) => {
      const cat = normalizeCertificateCategory(c.category);
      map.set(cat, (map.get(cat) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [certificates, dbCategories]);

  // Derive categories with counts for filter pills (categories with certificates or active filter)
  const categoriesWithCounts = useMemo(() => {
    const list = allCategoriesList.filter((cat) => cat.count > 0 || cat.name === categoryFilter);
    return list.length > 0 ? list : [{ name: 'Other', count: certificates.length }];
  }, [allCategoriesList, categoryFilter, certificates.length]);

  // If filtered category no longer has data available, reset filter to 'all'
  React.useEffect(() => {
    if (categoryFilter !== 'all') {
      const exists = allCategoriesList.some(
        (c) => c.name.toLowerCase() === categoryFilter.toLowerCase()
      );
      if (!exists) {
        setCategoryFilter('all');
      }
    }
  }, [allCategoriesList, categoryFilter]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      onShowToast('Required Field', 'Please enter a category name', 'error');
      return;
    }
    try {
      setIsCreatingCat(true);
      await api.createCertificateCategory(trimmed);
      onShowToast('Category Created', `Added category "${trimmed}"`, 'success');
      setNewCatName('');
      setIsAddCatModalOpen(false);
      loadCategories();
      onRefresh();
    } catch (err: any) {
      onShowToast('Error', err.message, 'error');
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deleteCatTarget) return;
    try {
      setIsDeletingCat(true);
      await api.deleteCertificateCategory(deleteCatTarget);
      onShowToast('Category Removed', `Category "${deleteCatTarget}" was removed`, 'info');
      if (categoryFilter.toLowerCase() === deleteCatTarget.toLowerCase()) {
        setCategoryFilter('all');
      }
      setDeleteCatTarget(null);
      loadCategories();
      onRefresh();
    } catch (err: any) {
      onShowToast('Delete Error', err.message, 'error');
    } finally {
      setIsDeletingCat(false);
    }
  };

  const openCreateModal = () => {
    setEditingCert(null);
    setFormTitle('');
    setFormIssuer('');
    setFormIssueDate('');
    const defaultCat =
      categoryFilter !== 'all' ? normalizeCertificateCategory(categoryFilter) : 'Academic';
    setFormCategory(defaultCat);
    setIsCustomCategory(false);
    setCustomCategoryName('');
    setFormCredentialId('');
    setFormVerifyUrl('');
    setFormImage('');
    setFormSkills([]);
    setSkillInput('');
    setFormOrder(certificates.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (cert: CertificateItem) => {
    setEditingCert(cert);
    setFormTitle(cert.title);
    setFormIssuer(cert.issuer);
    setFormIssueDate(cert.issueDate);
    setFormCategory(normalizeCertificateCategory(cert.category));
    setIsCustomCategory(false);
    setCustomCategoryName('');
    setFormCredentialId(cert.credentialId || '');
    setFormVerifyUrl(cert.verifyUrl || '');
    setFormImage(cert.image);
    setFormSkills(cert.skills || []);
    setSkillInput('');
    setFormOrder(cert.order ?? 0);
    setIsModalOpen(true);
  };


  const handleDuplicate = async (cert: CertificateItem) => {
    try {
      const payload: Partial<CertificateItem> = {
        title: `${cert.title} (Copy)`,
        issuer: cert.issuer,
        issueDate: cert.issueDate,
        category: normalizeCertificateCategory(cert.category),
        credentialId: cert.credentialId,
        verifyUrl: cert.verifyUrl,
        image: cert.image,
        skills: [...(cert.skills || [])],
        order: (cert.order || 0) + 1,
      };
      await api.createCertificate(payload);
      onShowToast('Duplicated', `Created copy of ${cert.title}`, 'success');
      onRefresh();
    } catch (e: any) {
      onShowToast('Error', e.message, 'error');
    }
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !formSkills.includes(trimmed)) {
      setFormSkills([...formSkills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (tag: string) => {
    setFormSkills(formSkills.filter((s) => s !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formIssuer || !formIssueDate || !formImage) {
      onShowToast('Required Fields', 'Title, issuer, date and image are required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const finalCategory = isCustomCategory && customCategoryName.trim()
        ? customCategoryName.trim()
        : formCategory;

      const payload: Partial<CertificateItem> = {
        title: formTitle,
        issuer: formIssuer,
        issueDate: formIssueDate,
        category: normalizeCertificateCategory(finalCategory),
        credentialId: formCredentialId,
        verifyUrl: formVerifyUrl,
        image: formImage,
        skills: formSkills,
        order: Number(formOrder),
      };

      if (editingCert && editingCert._id) {
        await api.updateCertificate(editingCert._id, payload);
        onShowToast('Saved', `Updated "${formTitle}"`, 'success');
      } else {
        await api.createCertificate(payload);
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
      await api.deleteCertificate(deleteTarget._id);
      onShowToast('Deleted', `Removed "${deleteTarget.title}"`, 'info');
      setDeleteTarget(null);
      onRefresh();
    } catch (err: any) {
      onShowToast('Delete Error', err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShiftOrder = async (cert: CertificateItem, delta: number) => {
    if (!cert._id) return;
    try {
      const newOrder = Math.max(0, (cert.order || 0) + delta);
      await api.updateCertificate(cert._id, { order: newOrder });
      onRefresh();
    } catch (err: any) {
      onShowToast('Reorder Error', err.message, 'error');
    }
  };

  // Filtered list based on search and category
  const filtered = useMemo(() => {
    return certificates.filter((c) => {
      const q = search.toLowerCase();
      const cat = normalizeCertificateCategory(c.category);
      const matchSearch =
        c.title.toLowerCase().includes(q) ||
        c.issuer.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        c.skills?.some((s) => s.toLowerCase().includes(q));

      const matchCat =
        categoryFilter === 'all' ||
        cat.toLowerCase() === categoryFilter.trim().toLowerCase();

      return matchSearch && matchCat;
    });
  }, [certificates, search, categoryFilter]);

  // Grouped certificates by category - strictly only categories with available certificates
  const groupedByCategory = useMemo(() => {
    const map = new Map<CertificateCategory, CertificateItem[]>();

    filtered.forEach((cert) => {
      const cat = normalizeCertificateCategory(cert.category);
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(cert);
    });

    const groups: { category: string; items: CertificateItem[] }[] = [];
    allCategoriesList.forEach(({ name: cat }) => {
      const items = map.get(cat);
      if (items && items.length > 0) {
        items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        groups.push({ category: cat, items });
      }
    });

    map.forEach((items, cat) => {
      if (!groups.some((g) => g.category.toLowerCase() === cat.toLowerCase()) && items.length > 0) {
        items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        groups.push({ category: cat, items });
      }
    });

    return groups;
  }, [filtered, allCategoriesList]);

  // Card renderer
  const renderCertificateCard = (cert: CertificateItem) => {
    const certCat = normalizeCertificateCategory(cert.category);
    return (
      <div
        key={cert._id || cert.title}
        className="group rounded-2xl border border-sky-200 bg-[#f0f7ff] hover:border-orange-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs"
      >
        <div>
          <div className="relative h-48 w-full bg-white overflow-hidden border-b border-sky-200">
            <img
              src={cert.image}
              alt={cert.title}
              className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
            />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setCategoryFilter(certCat)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-white/95 hover:bg-orange-50 text-slate-900 hover:text-orange-600 border border-sky-200 backdrop-blur-xs transition cursor-pointer shadow-xs"
                title={`View all in category "${certCat}"`}
              >
                <Tag className="w-3 h-3 text-orange-500" />
                <span>{certCat}</span>
              </button>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 border border-sky-200 rounded-lg px-2 py-0.5 text-xs text-slate-800 font-mono font-bold backdrop-blur-xs shadow-xs">
              <span>#{cert.order ?? 0}</span>
              <button
                onClick={() => handleShiftOrder(cert, -1)}
                className="hover:text-orange-600 p-0.5 transition cursor-pointer"
                title="Move up"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleShiftOrder(cert, 1)}
                className="hover:text-orange-600 p-0.5 transition cursor-pointer"
                title="Move down"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-3">
            <div>
              <h3 className="text-base font-bold text-slate-950 tracking-tight line-clamp-1 group-hover:text-orange-600 transition-colors" title={cert.title}>
                {cert.title}
              </h3>
              <div className="text-xs text-slate-700 mt-1 flex items-center gap-1.5 font-medium">
                <span className="font-bold text-slate-900">{cert.issuer}</span>
                <span className="text-slate-400">·</span>
                <span>{cert.issueDate}</span>
              </div>
            </div>

            {cert.credentialId && (
              <div className="text-xs font-mono font-semibold text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-sky-200 truncate shadow-2xs">
                ID: {cert.credentialId}
              </div>
            )}

            {cert.skills && cert.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {cert.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white text-slate-900 font-semibold border border-sky-200 shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-3.5 border-t border-sky-200/80 bg-white/70 flex items-center justify-between text-xs">
          <div>
            {cert.verifyUrl ? (
              <a
                href={cert.verifyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-800 hover:text-orange-600 transition flex items-center gap-1.5 font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Verify Credential</span>
              </a>
            ) : (
              <span className="text-slate-400 font-medium">No link</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleDuplicate(cert)}
              className="p-1.5 rounded-lg text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer"
              title="Duplicate Certificate"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => openEditModal(cert)}
              className="p-1.5 rounded-lg text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer"
              title="Edit Certificate"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeleteTarget(cert)}
              className="p-1.5 rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Delete Certificate"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-200/70">
        <div>
          <h2 className="text-xl font-bold text-slate-950 tracking-tight flex items-center gap-2.5">
            <span>Verified Certificates & Honors</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-200/80">
              {certificates.length} total
            </span>
          </h2>
          <div className="text-xs text-slate-600 font-medium mt-1">
            Manage your credentials, custom categories, and verification links
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsManageCatsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-sky-200 hover:border-orange-300 hover:text-orange-700 text-slate-800 text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Manage all categories"
          >
            <FolderKanban className="w-3.5 h-3.5 text-orange-500" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={() => {
              setNewCatName('');
              setIsAddCatModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-orange-200 hover:bg-orange-50 text-orange-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Category</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold shadow-sm shadow-orange-500/25 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Certificate</span>
          </button>
        </div>
      </div>

      {/* CATEGORY SECTION - Sky Blue Container */}
      <div className="rounded-2xl border border-sky-200 bg-[#f0f7ff] p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-200/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-orange-500 shadow-xs">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-950 tracking-tight flex items-center gap-2">
                <span>Certificate Categories</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-900 border border-sky-200 font-bold">
                  {categoriesWithCounts.length} {categoriesWithCounts.length === 1 ? 'Category' : 'Categories'}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Click a category to filter, create new categories, or click delete to remove
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-white border border-sky-200 rounded-xl text-xs self-start sm:self-auto shadow-xs">
            <button
              onClick={() => setViewLayout('grouped')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewLayout === 'grouped'
                  ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/20'
                  : 'text-slate-800 hover:text-orange-600'
              }`}
              title="Display certificates organized under category section blocks"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Category Sections</span>
            </button>
            <button
              onClick={() => setViewLayout('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewLayout === 'grid'
                  ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/20'
                  : 'text-slate-800 hover:text-orange-600'
              }`}
              title="Display all certificates in a unified grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Unified Grid</span>
            </button>
          </div>
        </div>

        {/* Category Pills & Breakdown Bar */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              categoryFilter === 'all'
                ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/20'
                : 'bg-white border border-sky-200 text-slate-800 hover:border-orange-300 hover:text-orange-600'
            }`}
          >
            <span>All Categories</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                categoryFilter === 'all' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-900'
              }`}
            >
              {certificates.length}
            </span>
          </button>

          {categoriesWithCounts.map(({ name, count }) => {
            const isSelected = categoryFilter.toLowerCase() === name.toLowerCase();
            return (
              <div
                key={name}
                className={`group/pill pl-3.5 pr-2 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/20'
                    : 'bg-white border border-sky-200 text-slate-800 hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCategoryFilter(isSelected ? 'all' : name)}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <Tag className="w-3 h-3 opacity-70" />
                  <span>{name}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-900'
                    }`}
                  >
                    {count}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteCatTarget(name);
                  }}
                  className={`p-1 rounded-md opacity-0 group-hover/pill:opacity-100 transition-opacity cursor-pointer ${
                    isSelected
                      ? 'hover:bg-white/20 text-white'
                      : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                  }`}
                  title={`Delete category "${name}"`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => {
              setNewCatName('');
              setIsAddCatModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-dashed border-orange-300 bg-white hover:bg-orange-50 text-orange-700 shadow-2xs"
            title="Create a new category"
          >
            <Plus className="w-3 h-3 text-orange-500" />
            <span>Add Category</span>
          </button>
        </div>
      </div>


      {/* Search and Secondary Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, issuer, category, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Category Banner when specific category is filtered */}
      {categoryFilter !== 'all' && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-xs animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <Tag className="w-4 h-4 text-orange-600" />
            <span className="text-slate-800 font-medium">
              Showing certificates in category: <strong className="text-orange-700 font-bold">{categoryFilter}</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white text-orange-800 font-mono text-[11px] font-bold border border-orange-200">
              {filtered.length} {filtered.length === 1 ? 'certificate' : 'certificates'}
            </span>
          </div>
          <button
            onClick={() => setCategoryFilter('all')}
            className="text-xs text-orange-700 hover:text-orange-800 font-bold underline underline-offset-2 transition cursor-pointer"
          >
            Show All Categories
          </button>
        </div>
      )}

      {/* MAIN VIEW CONTENT */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-sky-300 bg-[#f0f7ff] text-xs text-slate-600 space-y-2">
          <FolderKanban className="w-8 h-8 text-sky-400 mx-auto stroke-[1.5]" />
          <div className="font-bold text-slate-800 text-sm">No certificates found</div>
          <p className="text-slate-600 font-medium">
            {search || categoryFilter !== 'all'
              ? 'Try clearing active search or category filters'
              : 'Click "Add Certificate" to create your first certificate'}
          </p>
          {(search || categoryFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewLayout === 'grouped' && categoryFilter === 'all' ? (
        /* GROUPED CATEGORY SECTIONS */
        <div className="space-y-8">
          {groupedByCategory.map((group) => (
            <section
              key={group.category}
              className="rounded-2xl border border-sky-200 bg-[#f0f7ff]/70 p-6 space-y-4 shadow-xs"
            >
              {/* Category Section Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-sky-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-orange-500 shadow-xs">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-950 tracking-tight flex items-center gap-2">
                      <span>{group.category}</span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white text-slate-800 border border-sky-200">
                        {group.items.length} {group.items.length === 1 ? 'certificate' : 'certificates'}
                      </span>
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setCategoryFilter(group.category)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-orange-600 font-bold transition cursor-pointer"
                  title={`Focus on ${group.category}`}
                >
                  <span>Focus category</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Grid for this category */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {group.items.map(renderCertificateCard)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* UNIFIED GRID VIEW (or filtered view) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(renderCertificateCard)}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white border border-sky-200 rounded-2xl shadow-2xl flex flex-col text-slate-950 my-8 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-sky-100 bg-[#f0f7ff]">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-orange-500" />
                <span>{editingCert ? 'Edit Certificate' : 'New Certificate'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-600 hover:text-orange-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Certificate Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Certified Solutions Architect"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Issuing Organization</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon Web Services, Meta, Coursera"
                    value={formIssuer}
                    onChange={(e) => setFormIssuer(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                  />
                </div>
              </div>

              {/* CATEGORY FIELD - Dynamic & Custom Categories */}
              <div className="space-y-2.5 p-4 rounded-xl bg-sky-50 border border-sky-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-orange-500" />
                    <span>Certificate Category</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(!isCustomCategory);
                      if (!isCustomCategory) {
                        setCustomCategoryName('');
                      }
                    }}
                    className="text-xs text-orange-600 hover:text-orange-700 font-semibold cursor-pointer underline"
                  >
                    {isCustomCategory ? 'Choose from list' : '+ Add custom category'}
                  </button>
                </div>

                {!isCustomCategory ? (
                  <>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-bold focus:outline-hidden focus:border-orange-500"
                    >
                      {allCategoriesList.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {allCategoriesList.slice(0, 8).map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setFormCategory(cat.name)}
                          className={`text-xs py-1.5 px-2.5 rounded-lg border text-center transition cursor-pointer font-bold ${
                            formCategory === cat.name
                              ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                              : 'bg-white border-sky-200 text-slate-800 hover:text-orange-600 hover:border-orange-300'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Type custom category name (e.g. AI & ML, Hackathons)..."
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-orange-300 text-xs text-slate-950 font-semibold focus:outline-hidden focus:border-orange-500"
                    />
                    <div className="text-[11px] text-slate-600 font-medium">
                      This category will be saved and added to your certificate categories.
                    </div>
                  </div>
                )}
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Issue Date</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. May 2024"
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
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
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium font-mono focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Credential ID</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS-SA-938210"
                    value={formCredentialId}
                    onChange={(e) => setFormCredentialId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-mono font-medium focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Verification URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formVerifyUrl}
                    onChange={(e) => setFormVerifyUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                  />
                </div>
              </div>

              {/* Certificate Image with System Upload */}
              <ImageUploadField
                label="Certificate Proof / Badge Image"
                value={formImage}
                onChange={setFormImage}
                required
                onShowToast={onShowToast}
                placeholder="Image URL or upload from system"
              />

              {/* Skills */}
              <div className="space-y-2 pt-2 border-t border-sky-100">
                <label className="font-bold text-slate-900 block">Associated Skills / Topics</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add skill and press Enter"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 min-h-[26px]">
                  {formSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 border border-sky-200 text-slate-950 text-xs font-semibold"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
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
                  {isSaving ? 'Saving...' : editingCert ? 'Save Changes' : 'Create Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Certificate"
        itemName={deleteTarget?.title || ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* CREATE CATEGORY MODAL */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-sky-200 rounded-2xl shadow-2xl p-6 text-slate-950">
            <div className="flex items-center justify-between pb-4 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-950">New Certificate Category</h3>
              </div>
              <button
                onClick={() => setIsAddCatModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="pt-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900">Category Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Cloud & DevOps, Hackathons, AI & Data"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                />
              </div>

              <div className="pt-3 border-t border-sky-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-sky-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCat}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isCreatingCat ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE CATEGORIES MODAL */}
      {isManageCatsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-sky-200 rounded-2xl shadow-2xl p-6 text-slate-950 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-sky-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Manage Certificate Categories</h3>
                  <div className="text-[11px] text-slate-600 font-medium">Add, review, or remove certificate categories</div>
                </div>
              </div>
              <button
                onClick={() => setIsManageCatsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Bar inside Modal */}
            <form onSubmit={handleCreateCategory} className="py-4 border-b border-sky-100 flex gap-2">
              <input
                type="text"
                placeholder="New category name (e.g. Design, Workshops)..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 focus:outline-hidden focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={isCreatingCat}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-50"
              >
                + Add
              </button>
            </form>

            {/* Category List */}
            <div className="py-4 space-y-2 max-h-80 overflow-y-auto">
              {allCategoriesList.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#f0f7ff] border border-sky-200 hover:border-orange-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Tag className="w-4 h-4 text-orange-500" />
                    <div>
                      <span className="font-bold text-xs text-slate-950">{cat.name}</span>
                      <span className="text-[11px] text-slate-600 font-medium ml-2 font-mono">
                        ({cat.count} {cat.count === 1 ? 'certificate' : 'certificates'})
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteCatTarget(cat.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title={`Delete category "${cat.name}"`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-sky-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageCatsOpen(false)}
                className="px-4 py-2 rounded-xl border border-sky-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteCatTarget)}
        title="Remove Certificate Category"
        itemName={deleteCatTarget ? `category "${deleteCatTarget}"` : ''}
        isDeleting={isDeletingCat}
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setDeleteCatTarget(null)}
      />
    </div>
  );
};
