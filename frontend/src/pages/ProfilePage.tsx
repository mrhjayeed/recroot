import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User as UserIcon, Tag, FolderGit2, FileText, Save, CheckCircle, AlertTriangle, Plus, Trash2, Edit3, Cloud, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { AttributePicker, AttributeItem } from '../components/AttributePicker';
import { OptimisticLockModal } from '../components/OptimisticLockModal';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, authHeader } = useAuth();
  const { t } = useThemeLanguage();
  const navigate = useNavigate();

  const targetId = id || user?.id;
  const isOwner = user?.id === targetId;
  const isAdmin = user?.role === 'ADMIN';
  const canEdit = isOwner || isAdmin;

  const [profileData, setProfileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'me' | 'info' | 'projects' | 'cvs'>('me');
  const [isLoading, setIsLoading] = useState(true);

  // Mandatory "Me" section form states
  const [meFirstName, setMeFirstName] = useState('');
  const [meLastName, setMeLastName] = useState('');
  const [meLocation, setMeLocation] = useState('');
  const [mePhotoUrl, setMePhotoUrl] = useState('');

  // Info Section Custom Attribute values state
  const [customAttributeValues, setCustomAttributeValues] = useState<Record<string, { value: string; version: number }>>({});
  const [isAttributePickerOpen, setIsAttributePickerOpen] = useState(false);

  // Auto-Save Status (Requirement: Every 5-10 seconds, optimistic locking)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const pendingAttributeChanges = useRef<Record<string, string>>({});

  // Projects Modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [projName, setProjName] = useState('');
  const [projStart, setProjStart] = useState('');
  const [projEnd, setProjEnd] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projTags, setProjTags] = useState<string[]>([]);
  const [projTagInput, setProjTagInput] = useState('');
  const [autocompleteTags, setAutocompleteTags] = useState<string[]>([]);

  // Optimistic locking conflict modal
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [conflictMsg, setConflictMsg] = useState('');

  useEffect(() => {
    if (targetId) {
      fetchProfile();
      fetchTagAutocomplete();
    }
  }, [targetId]);

  // Set up 5-10 seconds Auto-Save Interval for profile attributes
  useEffect(() => {
    if (!canEdit) return;
    const interval = setInterval(() => {
      triggerAutoSave();
    }, 7000);
    return () => clearInterval(interval);
  }, [customAttributeValues, canEdit]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/profile/${targetId}`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.profile);
        setMeFirstName(data.profile.me.firstName);
        setMeLastName(data.profile.me.lastName);
        setMeLocation(data.profile.me.location || '');
        setMePhotoUrl(data.profile.me.photoUrl || '');

        // Map custom attributes
        const attrMap: Record<string, { value: string; version: number }> = {};
        data.profile.attributes.forEach((a: any) => {
          attrMap[a.attributeId] = { value: a.value, version: a.version };
        });
        setCustomAttributeValues(attrMap);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTagAutocomplete = async () => {
    try {
      const res = await fetch('/api/profile/tags/autocomplete');
      if (res.ok) {
        const data = await res.json();
        setAutocompleteTags(data.tags || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Mandatory "Me" section
  const handleSaveMe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({
          firstName: meFirstName,
          lastName: meLastName,
          location: meLocation,
          photoUrl: mePhotoUrl,
          targetUserId: targetId,
          version: profileData?.me?.version || 1,
        }),
      });

      if (res.status === 409) {
        const err = await res.json();
        setConflictMsg(err.error || t('conflictDesc'));
        setIsConflictOpen(true);
        return;
      }

      if (res.ok) {
        fetchProfile();
        alert('Mandatory profile details saved!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Track pending change in custom attribute input
  const handleAttributeValueChange = (attributeId: string, val: string) => {
    setCustomAttributeValues((prev) => ({
      ...prev,
      [attributeId]: {
        value: val,
        version: prev[attributeId]?.version || 1,
      },
    }));
    pendingAttributeChanges.current[attributeId] = val;
    setAutoSaveStatus('saving');
  };

  // Trigger 5-10 second Auto-Save execution with optimistic locking
  const triggerAutoSave = async () => {
    const keys = Object.keys(pendingAttributeChanges.current);
    if (keys.length === 0) {
      if (autoSaveStatus === 'saving') setAutoSaveStatus('saved');
      return;
    }

    setAutoSaveStatus('saving');
    for (const attrId of keys) {
      const val = pendingAttributeChanges.current[attrId];
      const version = customAttributeValues[attrId]?.version || 1;

      try {
        const res = await fetch('/api/profile/attributes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader(),
          },
          body: JSON.stringify({
            attributeId: attrId,
            value: val,
            version,
            targetUserId: targetId,
          }),
        });

        if (res.status === 409) {
          const err = await res.json();
          setAutoSaveStatus('error');
          setConflictMsg(err.error || 'Auto-save conflict on custom attribute.');
          setIsConflictOpen(true);
          delete pendingAttributeChanges.current[attrId];
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setCustomAttributeValues((prev) => ({
            ...prev,
            [attrId]: {
              value: data.attributeValue.value,
              version: data.attributeValue.version,
            },
          }));
          delete pendingAttributeChanges.current[attrId];
        }
      } catch (e) {
        console.error(e);
        setAutoSaveStatus('error');
      }
    }

    setAutoSaveStatus('saved');
  };

  const handleSelectAttributeFromPicker = async (attr: AttributeItem) => {
    setIsAttributePickerOpen(false);
    if (customAttributeValues[attr.id]) return;

    try {
      const res = await fetch('/api/profile/attributes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({
          attributeId: attr.id,
          value: '',
          version: 1,
          targetUserId: targetId,
        }),
      });

      if (res.ok) {
        fetchProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveAttribute = async (attributeId: string) => {
    if (!window.confirm('Remove this attribute from your profile?')) return;
    try {
      await fetch(`/api/profile/attributes/${attributeId}?targetUserId=${targetId}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  // Save Candidate Project
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: projName,
      startDate: projStart,
      endDate: projEnd,
      description: projDesc,
      tags: projTags,
      targetUserId: targetId,
    };

    try {
      const url = editingProject ? `/api/profile/projects/${editingProject.id}` : '/api/profile/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsProjectModalOpen(false);
        fetchProfile();
        fetchTagAutocomplete();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await fetch(`/api/profile/projects/${projectId}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="max-w-7xl mx-auto p-8 text-center text-slate-400">Loading user profile...</div>;
  }

  if (!profileData) {
    return <div className="max-w-7xl mx-auto p-8 text-center text-slate-400">Profile not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={profileData.me.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
            alt="Avatar"
            className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-500 shadow-md"
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{profileData.me.firstName} {profileData.me.lastName}</span>
              <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                {profileData.me.role}
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {profileData.me.email} • {profileData.me.location || 'Location not set'}
            </p>
          </div>
        </div>

        {/* Auto-Save Indicator Badge */}
        {canEdit && (
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
            {autoSaveStatus === 'saving' && (
              <span className="text-amber-500 flex items-center gap-1 animate-pulse">
                <Cloud className="w-4 h-4" /> {t('autoSaveSaving')}
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> {t('autoSaveSaved')}
              </span>
            )}
            {autoSaveStatus === 'error' && (
              <span className="text-rose-500 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> {t('autoSaveError')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('me')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'me'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>{t('tabMe')}</span>
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'info'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>{t('tabInfo')} ({profileData.attributes?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'projects'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>{t('tabProjects')} ({profileData.projects?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('cvs')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'cvs'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t('tabCVs')} ({profileData.cvs?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Me (Built-in mandatory fields) */}
      {activeTab === 'me' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm max-w-xl space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
            Mandatory Personal Details
          </h3>
          <form onSubmit={handleSaveMe} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={meFirstName}
                  onChange={(e) => setMeFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={meLastName}
                  onChange={(e) => setMeLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Location</label>
              <input
                type="text"
                disabled={!canEdit}
                value={meLocation}
                onChange={(e) => setMeLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Photo URL</label>
              <input
                type="url"
                disabled={!canEdit}
                value={mePhotoUrl}
                onChange={(e) => setMePhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            {canEdit && (
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t('save')}</span>
              </button>
            )}
          </form>
        </div>
      )}

      {/* Tab 2: Info (Custom Attributes with 5-10s Auto-Save) */}
      {activeTab === 'info' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                User Selected Attributes from Library
              </h3>
              <p className="text-xs text-slate-500">
                Changes auto-save every 5-10 seconds with optimistic locking.
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => setIsAttributePickerOpen(!isAttributePickerOpen)}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Attributes from Library</span>
              </button>
            )}
          </div>

          {/* Inline Attribute Picker */}
          {isAttributePickerOpen && (
            <div className="animate-in fade-in">
              <AttributePicker
                selectedAttributeIds={profileData.attributes?.map((a: any) => a.attributeId)}
                onSelectAttribute={handleSelectAttributeFromPicker}
              />
            </div>
          )}

          {/* Selected Attribute Values list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileData.attributes?.length === 0 ? (
              <div className="text-xs text-slate-400 p-4 border border-dashed rounded-2xl col-span-2 text-center">
                No custom attributes added yet. Click "Add Attributes from Library" above to select skills.
              </div>
            ) : (
              profileData.attributes?.map((attr: any) => {
                const currentVal = customAttributeValues[attr.attributeId]?.value ?? attr.value;
                return (
                  <div
                    key={attr.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{attr.attributeName}</span>
                        <span className="ml-2 text-[10px] text-slate-400">({attr.categoryName})</span>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => handleRemoveAttribute(attr.attributeId)}
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Dynamic input control based on type */}
                    {attr.attributeType === 'BOOLEAN' ? (
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          disabled={!canEdit}
                          checked={currentVal === 'true'}
                          onChange={(e) =>
                            handleAttributeValueChange(attr.attributeId, e.target.checked ? 'true' : 'false')
                          }
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span>{currentVal === 'true' ? 'Yes / Enabled' : 'No / Disabled'}</span>
                      </label>
                    ) : attr.attributeType === 'DROPDOWN' ? (
                      <select
                        disabled={!canEdit}
                        value={currentVal}
                        onChange={(e) => handleAttributeValueChange(attr.attributeId, e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      >
                        <option value="">-- Select option --</option>
                        {attr.options?.map((opt: string) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : attr.attributeType === 'TEXT' ? (
                      <textarea
                        rows={2}
                        disabled={!canEdit}
                        value={currentVal}
                        onChange={(e) => handleAttributeValueChange(attr.attributeId, e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    ) : (
                      <input
                        type={attr.attributeType === 'NUMERIC' ? 'number' : attr.attributeType === 'DATE' ? 'date' : 'text'}
                        disabled={!canEdit}
                        value={currentVal}
                        onChange={(e) => handleAttributeValueChange(attr.attributeId, e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Projects (CRUD + Markdown + Tag Autocompletion) */}
      {activeTab === 'projects' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Candidate Projects List
            </h3>
            {canEdit && (
              <button
                onClick={() => {
                  setEditingProject(null);
                  setProjName('');
                  setProjStart('');
                  setProjEnd('');
                  setProjDesc('');
                  setProjTags([]);
                  setIsProjectModalOpen(true);
                }}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {profileData.projects?.length === 0 ? (
              <div className="text-xs text-slate-400 p-4 border border-dashed rounded-2xl text-center">
                No projects added yet.
              </div>
            ) : (
              profileData.projects?.map((proj: any) => (
                <div
                  key={proj.id}
                  className="p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{proj.name}</h4>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Period: {proj.startDate || 'N/A'} — {proj.endDate || 'Present'}
                      </div>
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingProject(proj);
                            setProjName(proj.name);
                            setProjStart(proj.startDate);
                            setProjEnd(proj.endDate);
                            setProjDesc(proj.description);
                            setProjTags(proj.tags || []);
                            setIsProjectModalOpen(true);
                          }}
                          className="p-1 text-sky-600 hover:bg-sky-100 rounded"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="prose dark:prose-invert prose-xs text-slate-700 dark:text-slate-300">
                    <ReactMarkdown>{proj.description}</ReactMarkdown>
                  </div>

                  {proj.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                      {proj.tags.map((t: string) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-semibold text-[10px]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Candidate CVs Table View */}
      {activeTab === 'cvs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="p-3.5">Target Position</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Recruiter Likes</th>
                  <th className="p-3.5 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {profileData.cvs?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      No CVs created yet. Browse available positions to generate tailored CVs!
                    </td>
                  </tr>
                ) : (
                  profileData.cvs?.map((cv: any) => (
                    <tr key={cv.id} className="hover:bg-sky-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        <Link to={`/cv/${cv.id}`} className="hover:text-sky-600 underline">
                          {cv.positionTitle}
                        </Link>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cv.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {cv.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-rose-500">{cv.likesCount}</td>
                      <td className="p-3.5 text-right font-mono text-slate-400">
                        {new Date(cv.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidate Project Add/Edit Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingProject ? 'Edit Project' : 'Add Candidate Project'}
              </h3>
              <button onClick={() => setIsProjectModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={projStart}
                    onChange={(e) => setProjStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    value={projEnd}
                    onChange={(e) => setProjEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description (Markdown Supported)</label>
                <textarea
                  rows={3}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Technology Tags (Autocompletion)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={projTagInput}
                    onChange={(e) => setProjTagInput(e.target.value)}
                    placeholder="Type tag (e.g. Python)"
                    className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (projTagInput.trim() && !projTags.includes(projTagInput.trim())) {
                        setProjTags([...projTags, projTagInput.trim()]);
                        setProjTagInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-xl font-semibold"
                  >
                    Add
                  </button>
                </div>

                {/* Autocomplete suggestions */}
                {autocompleteTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] text-slate-400">Suggestions:</span>
                    {autocompleteTags.slice(0, 5).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (!projTags.includes(tag)) setProjTags([...projTags, tag]);
                        }}
                        className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded hover:bg-sky-100"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {projTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-semibold"
                    >
                      #{t}
                      <button type="button" onClick={() => setProjTags(projTags.filter((i) => i !== t))}>
                        <X className="w-3 h-3 hover:text-rose-600" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold">
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conflict Modal */}
      <OptimisticLockModal
        isOpen={isConflictOpen}
        message={conflictMsg}
        onReload={() => {
          setIsConflictOpen(false);
          fetchProfile();
        }}
      />
    </div>
  );
};
