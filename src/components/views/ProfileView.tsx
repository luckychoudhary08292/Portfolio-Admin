import React, { useState, useEffect } from 'react';
import {
  Save,
  Image as ImageIcon,
  Upload,
  X,
  ExternalLink,
} from 'lucide-react';
import { ProfileData } from '../../types.ts';
import { api } from '../../services/api.ts';
import { ImageUploadField } from '../ImageUploadField.tsx';

interface ProfileViewProps {
  initialProfile: ProfileData | null;
  onRefresh: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  initialProfile,
  onRefresh,
  onShowToast,
}) => {
  const [formData, setFormData] = useState<Partial<ProfileData>>({
    name: '',
    title: '',
    heroQuote: '',
    experienceYears: '',
    projectsCompleted: '',
    problemsSolved: '',
    gpa: '',
    degree: '',
    university: '',
    whyHireMeBio: '',
    email: '',
    phone: '',
    website: '',
    github: '',
    linkedin: '',
    leetcode: '',
    resumeUrl: '',
    heroImage: '',
    whyHireMeImage: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'bio' | 'links' | 'photos'>('profile');

  useEffect(() => {
    if (initialProfile) {
      setFormData((prev) => ({
        ...prev,
        ...initialProfile,
      }));
    }
  }, [initialProfile]);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.updateProfile(formData);
      onShowToast('Profile Updated', 'Saved changes to database', 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast('Save Error', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-sky-200/70">
        <div>
          <h2 className="text-xl font-bold text-slate-950 tracking-tight">Profile & Portfolio Bio</h2>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Manage your personal branding, credentials, links, and portfolio biography
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold shadow-sm shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 space-y-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#f0f7ff] border border-sky-200 shadow-xs text-xs font-semibold">
            {(['profile', 'bio', 'links', 'photos'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-xl capitalize transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-orange-500 text-white font-bold shadow-xs shadow-orange-500/20'
                    : 'text-slate-800 hover:text-orange-600 hover:bg-white/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSave} className="p-6 rounded-2xl border border-sky-200 bg-[#f0f7ff] shadow-xs space-y-5 text-xs">
            {/* TAB: General Profile & Academics */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                {/* Photo Upload Box inside Profile Tab for quick access */}
                <div className="p-4 rounded-xl bg-white border border-sky-200 flex items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-xl bg-sky-50 border border-sky-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {formData.heroImage ? (
                        <img src={formData.heroImage} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-sky-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-950 text-sm">Profile Headshot</div>
                      <div className="text-xs text-slate-600 font-medium mt-0.5">
                        Upload directly from your device or paste a photo URL
                      </div>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-semibold cursor-pointer transition-all shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-orange-600" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const raw = ev.target?.result as string;
                            handleChange('heroImage', raw);
                            onShowToast('Uploaded', file.name, 'success');
                          };
                          reader.readAsDataURL(file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Lucky Choudhary"
                      value={formData.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900">Professional Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineering Student"
                      value={formData.title || ''}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900">Degree & Specialization</label>
                    <input
                      type="text"
                      placeholder="e.g. B.Tech Computer Science"
                      value={formData.degree || ''}
                      onChange={(e) => handleChange('degree', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900">University / College</label>
                    <input
                      type="text"
                      placeholder="e.g. University Institute of Technology"
                      value={formData.university || ''}
                      onChange={(e) => handleChange('university', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900">GPA / Percentage</label>
                    <input
                      type="text"
                      placeholder="e.g. 8.8 / 10"
                      value={formData.gpa || ''}
                      onChange={(e) => handleChange('gpa', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900">Batch / Years</label>
                    <input
                      type="text"
                      placeholder="e.g. 2022 - 2026"
                      value={formData.experienceYears || ''}
                      onChange={(e) => handleChange('experienceYears', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Bio & Metrics */}
            {activeTab === 'bio' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Hero Tagline / Headline</label>
                  <input
                    type="text"
                    placeholder="Short personal quote or tagline"
                    value={formData.heroQuote || ''}
                    onChange={(e) => handleChange('heroQuote', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900">Projects Count Display</label>
                    <input
                      type="text"
                      placeholder="e.g. 20+"
                      value={formData.projectsCompleted || ''}
                      onChange={(e) => handleChange('projectsCompleted', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900">Problems Solved Display</label>
                    <input
                      type="text"
                      placeholder="e.g. 450+"
                      value={formData.problemsSolved || ''}
                      onChange={(e) => handleChange('problemsSolved', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Biography / Why Hire Me</label>
                  <textarea
                    rows={6}
                    placeholder="Write your professional bio..."
                    value={formData.whyHireMeBio || ''}
                    onChange={(e) => handleChange('whyHireMeBio', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB: Links & Social */}
            {activeTab === 'links' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900">Email Address</label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91..."
                      value={formData.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900">GitHub Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={formData.github || ''}
                      onChange={(e) => handleChange('github', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={formData.linkedin || ''}
                      onChange={(e) => handleChange('linkedin', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900">LeetCode Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://leetcode.com/..."
                      value={formData.leetcode || ''}
                      onChange={(e) => handleChange('leetcode', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900">Personal Portfolio / Website</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.website || ''}
                      onChange={(e) => handleChange('website', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900">Resume / CV Link</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={formData.resumeUrl || ''}
                    onChange={(e) => handleChange('resumeUrl', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-950 font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* TAB: Photos & Media */}
            {activeTab === 'photos' && (
              <div className="space-y-4">
                <ImageUploadField
                  label="Profile Headshot Photo"
                  value={formData.heroImage || ''}
                  onChange={(val) => handleChange('heroImage', val)}
                  onShowToast={onShowToast}
                  placeholder="Image URL or upload from system"
                />

                <ImageUploadField
                  label="About Banner Photo"
                  value={formData.whyHireMeImage || ''}
                  onChange={(val) => handleChange('whyHireMeImage', val)}
                  onShowToast={onShowToast}
                  placeholder="Image URL or upload from system"
                />
              </div>
            )}

            <div className="pt-4 border-t border-sky-200 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold shadow-sm shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column - Sky Blue Card */}
        <div>
          <div className="rounded-2xl border border-sky-200 bg-[#f0f7ff] p-5 space-y-4 shadow-xs sticky top-20">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Live Preview Card
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white border border-sky-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                {formData.heroImage ? (
                  <img src={formData.heroImage} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-sky-400" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-slate-950 truncate">
                  {formData.name || 'Your Name'}
                </h4>
                <p className="text-xs text-orange-600 font-semibold truncate mt-0.5">
                  {formData.title || 'Your Title'}
                </p>
                {formData.degree && (
                  <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">{formData.degree}</p>
                )}
              </div>
            </div>

            {formData.heroQuote && (
              <p className="text-xs italic text-slate-800 bg-white/70 p-3 rounded-xl border border-sky-200/80 leading-relaxed">
                "{formData.heroQuote}"
              </p>
            )}

            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-sky-200 shadow-xs">
                <span className="text-[10px] text-slate-600 font-bold block uppercase tracking-wider">GPA</span>
                <span className="font-extrabold text-slate-950 text-sm mt-0.5 block">{formData.gpa || '-'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-sky-200 shadow-xs">
                <span className="text-[10px] text-slate-600 font-bold block uppercase tracking-wider">Projects</span>
                <span className="font-extrabold text-slate-950 text-sm mt-0.5 block">{formData.projectsCompleted || '-'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-sky-200 shadow-xs">
                <span className="text-[10px] text-slate-600 font-bold block uppercase tracking-wider">Solved</span>
                <span className="font-extrabold text-slate-950 text-sm mt-0.5 block">{formData.problemsSolved || '-'}</span>
              </div>
            </div>

            {formData.whyHireMeBio && (
              <p className="text-xs text-slate-800 leading-relaxed line-clamp-4 bg-white/60 p-3 rounded-xl border border-sky-100">
                {formData.whyHireMeBio}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
