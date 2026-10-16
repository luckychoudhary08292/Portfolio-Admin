import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ExternalLink,
  Github,
  Star,
  Edit2,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import { ProjectItem } from '../../types.ts';
import { api } from '../../services/api.ts';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal.tsx';
import { ImageUploadField } from '../ImageUploadField.tsx';
import { SkillSearchPicker } from '../SkillSearchPicker.tsx';

interface ProjectsViewProps {
  projects: ProjectItem[];
  onRefresh: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  initialCreateOpen?: boolean;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onRefresh,
  onShowToast,
  initialCreateOpen,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(initialCreateOpen || false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formCategory, setFormCategory] = useState('Full-Stack');
  const [formTag, setFormTag] = useState('Full-Stack');
  const [formImage, setFormImage] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formGithubUrl, setFormGithubUrl] = useState('');
  const [formLiveUrl, setFormLiveUrl] = useState('');
  const [formMetrics, setFormMetrics] = useState('');
  const [formTechStack, setFormTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState('');
  const [formDeliverables, setFormDeliverables] = useState<string[]>([]);
  const [deliverableInput, setDeliverableInput] = useState('');
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formFeatured, setFormFeatured] = useState<boolean>(true);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormCategory('Full-Stack');
    setFormTag('Full-Stack');
    setFormImage('');
    setFormDescription('');
    setFormGithubUrl('');
    setFormLiveUrl('');
    setFormMetrics('');
    setFormTechStack([]);
    setTechInput('');
    setFormDeliverables([]);
    setDeliverableInput('');
    setFormOrder(projects.length + 1);
    setFormFeatured(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProjectItem) => {
    setEditingProject(p);
    setFormTitle(p.title);
    setFormSubtitle(p.subtitle || '');
    setFormCategory(p.category || 'Full-Stack');
    setFormTag(p.tag || p.category || 'Full-Stack');
    setFormImage(p.image);
    setFormDescription(p.description);
    setFormGithubUrl(p.githubUrl || '');
    setFormLiveUrl(p.liveUrl || '');
    setFormMetrics(p.metrics || '');
    setFormTechStack(p.techStack || []);
    setTechInput('');
    setFormDeliverables(p.deliverables || []);
    setDeliverableInput('');
    setFormOrder(p.order ?? 0);
    setFormFeatured(p.featured ?? true);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (p: ProjectItem) => {
    try {
      const payload: Partial<ProjectItem> = {
        title: `${p.title} (Copy)`,
        subtitle: p.subtitle,
        category: p.category,
        tag: p.tag,
        image: p.image,
        description: p.description,
        githubUrl: p.githubUrl,
        liveUrl: p.liveUrl,
        metrics: p.metrics,
        techStack: [...p.techStack],
        deliverables: p.deliverables ? [...p.deliverables] : [],
        order: (p.order || 0) + 1,
        featured: p.featured,
      };
      await api.createProject(payload);
      onShowToast('Duplicated', `Created copy of ${p.title}`, 'success');
      onRefresh();
    } catch (e: any) {
      onShowToast('Duplicate Error', e.message, 'error');
    }
  };

  const handleAddTech = () => {
    const trimmed = techInput.trim();
    if (trimmed && !formTechStack.includes(trimmed)) {
      setFormTechStack([...formTechStack, trimmed]);
      setTechInput('');
    }
  };

  const handleRemoveTech = (item: string) => {
    setFormTechStack(formTechStack.filter((t) => t !== item));
  };

  const handleAddDeliverable = () => {
    const trimmed = deliverableInput.trim();
    if (trimmed && !formDeliverables.includes(trimmed)) {
      setFormDeliverables([...formDeliverables, trimmed]);
      setDeliverableInput('');
    }
  };

  const handleRemoveDeliverable = (item: string) => {
    setFormDeliverables(formDeliverables.filter((d) => d !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDescription || !formImage) {
      onShowToast('Required Fields', 'Title, description, and image are required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<ProjectItem> = {
        title: formTitle,
        subtitle: formSubtitle,
        category: formCategory,
        tag: formTag,
        image: formImage,
        description: formDescription,
        githubUrl: formGithubUrl,
        liveUrl: formLiveUrl,
        metrics: formMetrics,
        techStack: formTechStack,
        deliverables: formDeliverables,
        order: Number(formOrder),
        featured: formFeatured,
      };

      if (editingProject && editingProject._id) {
        await api.updateProject(editingProject._id, payload);
        onShowToast('Saved', `Updated "${formTitle}"`, 'success');
      } else {
        await api.createProject(payload);
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
      await api.deleteProject(deleteTarget._id);
      onShowToast('Deleted', `Removed "${deleteTarget.title}"`, 'info');
      setDeleteTarget(null);
      onRefresh();
    } catch (err: any) {
      onShowToast('Delete Error', err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShiftOrder = async (p: ProjectItem, delta: number) => {
    if (!p._id) return;
    try {
      const newOrder = Math.max(0, (p.order || 0) + delta);
      await api.updateProject(p._id, { order: newOrder });
      onRefresh();
    } catch (err: any) {
      onShowToast('Reorder Error', err.message, 'error');
    }
  };

  const handleToggleFeatured = async (p: ProjectItem) => {
    if (!p._id) return;
    try {
      await api.updateProject(p._id, { featured: !p.featured });
      onShowToast(
        p.featured ? 'Unfeatured' : 'Featured',
        `"${p.title}" ${p.featured ? 'removed from' : 'marked as'} featured`,
        'success'
      );
      onRefresh();
    } catch (err: any) {
      onShowToast('Update Error', err.message, 'error');
    }
  };

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.subtitle || '').toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.techStack?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchCat =
        categoryFilter === 'all' ||
        (p.category || '').toLowerCase() === categoryFilter.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [projects, search, categoryFilter]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [projects]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-sky-200/70">
        <div>
          <h2 className="text-xl font-bold text-slate-950 tracking-tight">Project Portfolio Showcase</h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 font-medium">
            <span>{projects.length} total projects</span>
            <span className="text-slate-400">·</span>
            <span>{projects.filter((p) => p.featured).length} featured</span>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold shadow-sm shadow-orange-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects by title, stack, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs p-1.5 bg-[#f0f7ff] border border-sky-200 rounded-2xl shadow-xs">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl capitalize font-semibold transition cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/20'
                : 'text-slate-800 hover:text-orange-600 hover:bg-white/60'
            }`}
          >
            All Projects
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/20'
                  : 'text-slate-800 hover:text-orange-600 hover:bg-white/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid - Sky Blue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((proj) => (
          <div
            key={proj._id || proj.title}
            className="rounded-2xl border border-sky-200 bg-[#f0f7ff] hover:border-orange-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs group"
          >
            <div>
              <div className="relative h-48 w-full bg-white overflow-hidden border-b border-sky-200">
                <img
                  src={proj.image}
                  alt={proj.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />

                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-white/95 border border-sky-200 text-slate-900 shadow-xs">
                    {proj.tag || proj.category}
                  </span>
                  {proj.featured && (
                    <button
                      onClick={() => handleToggleFeatured(proj)}
                      className="p-1 rounded-lg bg-white/95 border border-sky-200 text-amber-500 hover:text-amber-600 shadow-xs cursor-pointer"
                      title="Featured Project"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                    </button>
                  )}
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 border border-sky-200 rounded-lg px-2 py-0.5 text-xs text-slate-800 font-mono font-bold shadow-xs">
                  <span>#{proj.order ?? 0}</span>
                  <button onClick={() => handleShiftOrder(proj, -1)} className="hover:text-orange-600 p-0.5 cursor-pointer">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleShiftOrder(proj, 1)} className="hover:text-orange-600 p-0.5 cursor-pointer">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <h3 className="text-base font-bold text-slate-950 tracking-tight truncate group-hover:text-orange-600 transition-colors">
                    {proj.title}
                  </h3>
                  {proj.subtitle && (
                    <p className="text-xs text-slate-700 font-semibold truncate mt-0.5">{proj.subtitle}</p>
                  )}
                  {proj.metrics && (
                    <div className="text-[11px] text-orange-700 font-mono font-bold mt-1 truncate bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60 inline-block">
                      {proj.metrics}
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-800 leading-relaxed line-clamp-3">
                  {proj.description}
                </p>

                {proj.deliverables && proj.deliverables.length > 0 && (
                  <div className="space-y-1 pt-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-700 tracking-wider">Deliverables</div>
                    <div className="text-xs text-slate-700 space-y-0.5 font-medium">
                      {proj.deliverables.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="text-orange-500 font-bold">✓</span>
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {proj.techStack && proj.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {proj.techStack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white border border-sky-200 text-slate-900 font-mono font-bold shadow-2xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 border-t border-sky-200/80 bg-white/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {proj.githubUrl && (
                  <a
                    href={proj.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-800 hover:text-orange-600 font-bold transition flex items-center gap-1"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>Repo</span>
                  </a>
                )}
                {proj.liveUrl && proj.liveUrl !== '#' && (
                  <a
                    href={proj.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-800 hover:text-orange-600 font-bold transition flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Demo</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDuplicate(proj)}
                  className="p-1.5 rounded-lg text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer"
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => openEditModal(proj)}
                  className="p-1.5 rounded-lg text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(proj)}
                  className="p-1.5 rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-dashed border-sky-300 bg-[#f0f7ff] text-xs text-slate-600 font-medium">
          No projects found matching the criteria.
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-sky-200 rounded-2xl shadow-2xl flex flex-col text-slate-950 my-8 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-sky-100 bg-[#f0f7ff]">
              <h3 className="text-base font-bold text-slate-950">
                {editingProject ? 'Edit Project' : 'New Project Showcase'}
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
                  <label className="font-bold text-slate-900">Project Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DevCollab Cloud IDE"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Subtitle / Tagline</label>
                  <input
                    type="text"
                    placeholder="Short summary tagline"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      if (!formTag) setFormTag(e.target.value);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium focus:outline-hidden focus:border-orange-500"
                  >
                    <option value="Full-Stack">Full-Stack</option>
                    <option value="Backend & Systems">Backend & Systems</option>
                    <option value="AI & Web">AI & Web</option>
                    <option value="Cloud Native">Cloud Native</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Tag</label>
                  <input
                    type="text"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Order</label>
                  <input
                    type="number"
                    min="0"
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium font-mono focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5 flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="rounded text-orange-500 focus:ring-orange-500/30"
                    />
                    <span>Featured</span>
                  </label>
                </div>
              </div>

              {/* Project Image with System Upload */}
              <ImageUploadField
                label="Project Cover Image"
                value={formImage}
                onChange={setFormImage}
                required
                onShowToast={onShowToast}
                placeholder="Image URL or upload from system"
              />

              <div className="space-y-1.5">
                <label className="font-bold text-slate-900">Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Overview of architecture, features, and key challenges solved..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">GitHub Repository URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={formGithubUrl}
                    onChange={(e) => setFormGithubUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Live Demo URL</label>
                  <input
                    type="text"
                    placeholder="https://... or #"
                    value={formLiveUrl}
                    onChange={(e) => setFormLiveUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-900">Key Metrics / Impact Tag</label>
                <input
                  type="text"
                  placeholder="e.g. < 35ms Latency • 10k Users"
                  value={formMetrics}
                  onChange={(e) => setFormMetrics(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                />
              </div>

              {/* Tech Stack */}
              <div className="space-y-2.5 pt-2 border-t border-sky-100">
                <label className="font-bold text-slate-900 block">Tech Stack Tags</label>
                <SkillSearchPicker
                  onSelectSkill={(skill) => {
                    if (!formTechStack.includes(skill.name)) {
                      setFormTechStack([...formTechStack, skill.name]);
                    }
                  }}
                  existingSkillNames={formTechStack}
                  placeholder="Search technical skills to add to this project..."
                />

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Or type custom tech (e.g. React 19)"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTech();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950"
                  />
                  <button
                    type="button"
                    onClick={handleAddTech}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 min-h-[26px]">
                  {formTechStack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 border border-sky-200 text-slate-950 text-xs font-mono font-bold"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(tech)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Deliverables */}
              <div className="space-y-2 pt-2 border-t border-sky-100">
                <label className="font-bold text-slate-900 block">Key Deliverables</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add deliverable"
                    value={deliverableInput}
                    onChange={(e) => setDeliverableInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDeliverable();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 min-h-[26px]">
                  {formDeliverables.map((del) => (
                    <span
                      key={del}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 border border-sky-200 text-slate-950 text-xs font-medium"
                    >
                      {del}
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(del)}
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
                  {isSaving ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Project"
        itemName={deleteTarget?.title || ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
