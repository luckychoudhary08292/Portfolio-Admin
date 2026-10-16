import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Sparkles,
  Check,
  X,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { SkillLibraryItem, SkillItem } from '../types.ts';
import { api } from '../services/api.ts';

interface SkillSearchPickerProps {
  onSelectSkill: (skill: SkillItem) => void;
  existingSkillNames?: string[];
  placeholder?: string;
}

export const SkillSearchPicker: React.FC<SkillSearchPickerProps> = ({
  onSelectSkill,
  existingSkillNames = [],
  placeholder = 'Search technical skills (e.g. Java, C++, React, Node.js, Docker)...',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [library, setLibrary] = useState<SkillLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customLevel, setCustomLevel] = useState<string>('Proficient');

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch skill library on load
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api
      .getSkillLibrary()
      .then((data) => {
        if (isMounted) setLibrary(data);
      })
      .catch((err) => {
        console.error('Failed to load skill library:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    library.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [library]);

  // Filter skills based on query and category
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return library.filter((s) => {
      const matchCat =
        selectedCategory === 'all' ||
        s.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [library, query, selectedCategory]);

  const existingLower = useMemo(
    () => new Set(existingSkillNames.map((n) => n.trim().toLowerCase())),
    [existingSkillNames]
  );

  const handlePick = (item: SkillLibraryItem) => {
    onSelectSkill({
      name: item.name,
      level: item.level || customLevel || 'Proficient',
      badge: item.badge || item.slug,
      iconUrl: item.iconUrl,
      color: item.color,
      category: item.category,
    });
    setQuery('');
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const badge = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
    onSelectSkill({
      name: trimmed,
      level: customLevel || 'Proficient',
      badge,
      color: '#64748b',
      iconUrl: `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${badge}/${badge}-original.svg`,
    });
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <label className="font-medium text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-slate-400" />
          <span>Skill Library Picker</span>
        </label>
        <span className="text-[11px] text-slate-500 font-mono">
          {library.length} pre-built technical skills
        </span>
      </div>

      {/* Input bar */}
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 absolute left-3 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (filtered.length > 0) {
                handlePick(filtered[0]);
              } else if (query.trim()) {
                handleAddCustom();
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-24 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-slate-600 transition"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-80 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col text-xs text-slate-200 animate-in fade-in">
          {/* Quick Category Tabs & Level selector */}
          <div className="p-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-slate-400">
              <span>Level:</span>
              <select
                value={customLevel}
                onChange={(e) => setCustomLevel(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-200 focus:outline-hidden"
              >
                <option value="Proficient">Proficient</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
                <option value="Core">Core</option>
                <option value="Familiar">Familiar</option>
              </select>
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto max-h-60 p-2 space-y-1">
            {loading && library.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs">
                Loading technical skills library...
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filtered.map((item) => {
                  const isAdded = existingLower.has(item.name.toLowerCase());

                  return (
                    <button
                      key={item._id || item.slug}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handlePick(item)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition cursor-pointer ${
                        isAdded
                          ? 'bg-slate-950/40 border-slate-800/40 opacity-40 cursor-not-allowed'
                          : 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.iconUrl ? (
                          <div className="w-6 h-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            <img
                              src={item.iconUrl}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                // Fallback icon on broken image
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400 shrink-0">
                            {item.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="font-medium text-white truncate flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.popular && (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" title="Popular skill" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                            <span>{item.category}</span>
                            <span>·</span>
                            <span>{item.badge}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isAdded ? (
                          <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                            <Check className="w-3 h-3" />
                            Added
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 group-hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            + Add
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center space-y-2">
                <div className="text-slate-400">
                  No skills matching <span className="text-white font-medium">"{query}"</span>
                </div>
                {query.trim() && (
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add custom "{query.trim()}" to this category</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Bar: Custom Quick Add */}
          {query.trim() && filtered.length > 0 && (
            <div className="p-2 border-t border-slate-800/80 bg-slate-950/70 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Can't find exact match?
              </span>
              <button
                type="button"
                onClick={handleAddCustom}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium transition"
              >
                + Add custom "{query.trim()}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
