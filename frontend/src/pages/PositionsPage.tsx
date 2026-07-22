import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, Lock, Globe, AlertCircle, Plus, Check, Trash2, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { TableToolbar } from '../components/TableToolbar';
import { AttributePicker, AttributeItem } from '../components/AttributePicker';
import { OptimisticLockModal } from '../components/OptimisticLockModal';

export const PositionsPage: React.FC = () => {
  const { user, authHeader } = useAuth();
  const { t } = useThemeLanguage();
  const navigate = useNavigate();

  const [positions, setPositions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states for Create/Edit Position
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<any>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formShortDescription, setFormShortDescription] = useState('');
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [formMaxProjects, setFormMaxProjects] = useState(3);
  const [formProjectTags, setFormProjectTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);

  // Access rules builder
  const [accessRules, setAccessRules] = useState<any[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<AttributeItem[]>([]);

  // Conflict modal
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');

  const isRecruiterOrAdmin = user?.role === 'RECRUITER' || user?.role === 'ADMIN';

  useEffect(() => {
    fetchPositions();
    fetchAttributesForRules();
  }, []);

  const fetchPositions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/positions', { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setPositions(data.positions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttributesForRules = async () => {
    try {
      const res = await fetch('/api/attributes');
      if (res.ok) {
        const data = await res.json();
        setAvailableAttributes(data.attributes || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openCreateModal = () => {
    setEditingPosition(null);
    setFormTitle('');
    setFormShortDescription('');
    setFormIsPublic(true);
    setFormMaxProjects(3);
    setFormProjectTags([]);
    setSelectedAttributeIds([]);
    setAccessRules([]);
    setIsModalOpen(true);
  };

  const openEditModal = (pos: any) => {
    setEditingPosition(pos);
    setFormTitle(pos.title);
    setFormShortDescription(pos.shortDescription);
    setFormIsPublic(pos.isPublic);
    setFormMaxProjects(pos.maxProjects);
    setFormProjectTags(pos.projectTags || []);
    setSelectedAttributeIds(pos.attributeIds || []);
    setAccessRules(pos.accessRules || []);
    setIsModalOpen(true);
  };

  const handleDuplicate = async () => {
    if (selectedIds.length !== 1) return;
    const id = selectedIds[0];
    try {
      const res = await fetch(`/api/positions/${id}/duplicate`, {
        method: 'POST',
        headers: authHeader(),
      });
      if (res.ok) {
        fetchPositions();
        setSelectedIds([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected position(s)?`)) return;

    try {
      for (const id of selectedIds) {
        await fetch(`/api/positions/${id}`, {
          method: 'DELETE',
          headers: authHeader(),
        });
      }
      fetchPositions();
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: formTitle,
      shortDescription: formShortDescription,
      isPublic: formIsPublic,
      maxProjects: formMaxProjects,
      projectTags: formProjectTags,
      attributeIds: selectedAttributeIds,
      accessRules,
      version: editingPosition ? editingPosition.version : 1,
    };

    try {
      const url = editingPosition ? `/api/positions/${editingPosition.id}` : '/api/positions';
      const method = editingPosition ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        const errData = await res.json();
        setConflictMessage(errData.error || t('conflictDesc'));
        setIsConflictOpen(true);
        return;
      }

      if (res.ok) {
        setIsModalOpen(false);
        fetchPositions();
        setSelectedIds([]);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save position');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addProjectTag = () => {
    if (tagInput.trim() && !formProjectTags.includes(tagInput.trim())) {
      setFormProjectTags([...formProjectTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeProjectTag = (t: string) => {
    setFormProjectTags(formProjectTags.filter((item) => item !== t));
  };

  const addAccessRule = () => {
    if (availableAttributes.length === 0) return;
    const firstAttr = availableAttributes[0];
    setAccessRules([
      ...accessRules,
      { attributeId: firstAttr.id, operator: '=', value: '' },
    ]);
  };

  const updateAccessRule = (index: number, field: string, val: any) => {
    const next = [...accessRules];
    next[index][field] = val;
    setAccessRules(next);
  };

  const removeAccessRule = (index: number) => {
    setAccessRules(accessRules.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <span>{t('allPositions')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Recruiter position templates with dynamic attribute criteria and automatic CV alignment.
          </p>
        </div>
      </div>

      {/* Toolbar for row selections (No individual per-row edit/delete buttons!) */}
      <TableToolbar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onView={selectedIds.length === 1 ? () => navigate(`/positions/${selectedIds[0]}`) : undefined}
        onEdit={isRecruiterOrAdmin && selectedIds.length === 1 ? () => {
          const target = positions.find((p) => p.id === selectedIds[0]);
          if (target) openEditModal(target);
        } : undefined}
        onDuplicate={isRecruiterOrAdmin && selectedIds.length === 1 ? handleDuplicate : undefined}
        onDelete={isRecruiterOrAdmin && selectedIds.length > 0 ? handleDelete : undefined}
        onCreateNew={isRecruiterOrAdmin ? openCreateModal : undefined}
        createLabel={t('actionCreatePosition')}
      />

      {/* Positions Table View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <th className="p-3.5 w-10 text-center">☐</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Access / Eligibility</th>
                <th className="p-3.5">Required Attributes</th>
                <th className="p-3.5 text-center">Submitted CVs</th>
                <th className="p-3.5 text-right">Last Modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    Loading positions list...
                  </td>
                </tr>
              ) : positions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    {t('emptyList')}
                  </td>
                </tr>
              ) : (
                positions.map((pos) => {
                  const isSelected = selectedIds.includes(pos.id);
                  return (
                    <tr
                      key={pos.id}
                      onClick={() => toggleSelectRow(pos.id)}
                      className={`hover:bg-sky-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-sky-50 dark:bg-sky-950/40' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(pos.id)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white max-w-xs">
                        <Link
                          to={`/positions/${pos.id}`}
                          className="hover:text-sky-600 dark:hover:text-sky-400 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {pos.title}
                        </Link>
                        <div className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                          {pos.shortDescription}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-[11px] font-semibold">
                            {pos.isPublic ? (
                              <span className="text-emerald-600 flex items-center gap-1">
                                <Globe className="w-3.5 h-3.5" /> Public
                              </span>
                            ) : (
                              <span className="text-amber-600 flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5" /> Restricted
                              </span>
                            )}
                          </div>
                          {user?.role === 'CANDIDATE' && (
                            <div>
                              {pos.isEligible ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  <Check className="w-3 h-3" /> Eligible
                                </span>
                              ) : (
                                <span
                                  title={pos.failedRules?.join(', ')}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                >
                                  <AlertCircle className="w-3 h-3" /> Ineligible
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {pos.attributeIds?.length || 0} template fields
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-sky-600 dark:text-sky-400">
                        {pos.submittedCvCount}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-400">
                        v{pos.version} • {new Date(pos.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Position Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingPosition ? 'Edit Position Template' : 'Create Position Template'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePosition} className="space-y-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Position Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Junior Data Engineer @ Acme Corp"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formShortDescription}
                  onChange={(e) => setFormShortDescription(e.target.value)}
                  placeholder="Brief summary of requirements and responsibilities..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formIsPublic}
                    onChange={(e) => setFormIsPublic(e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Public Position (Accessible to all candidates)</span>
                </label>
              </div>

              {/* Project Tags & Max Projects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Filtered Projects in CV
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formMaxProjects}
                    onChange={(e) => setFormMaxProjects(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Project Tags Filter
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addProjectTag();
                        }
                      }}
                      placeholder="Add tag (e.g. Python, SQL)"
                      className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={addProjectTag}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formProjectTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-semibold text-[11px]"
                      >
                        #{t}
                        <button type="button" onClick={() => removeProjectTag(t)}>
                          <X className="w-3 h-3 hover:text-rose-600" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Attribute Picker Component Integration */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Select Template Attributes from Library ({selectedAttributeIds.length} selected)
                </label>
                <AttributePicker
                  selectedAttributeIds={selectedAttributeIds}
                  onSelectAttribute={(attr) => {
                    if (!selectedAttributeIds.includes(attr.id)) {
                      setSelectedAttributeIds([...selectedAttributeIds, attr.id]);
                    }
                  }}
                />
              </div>

              {/* Access Rules Builder */}
              <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Access Criteria / Filters (Candidates must meet these to apply)
                  </label>
                  <button
                    type="button"
                    onClick={addAccessRule}
                    className="text-sky-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Access Rule
                  </button>
                </div>

                {accessRules.length === 0 ? (
                  <div className="text-slate-400 text-[11px]">No access filters added. Position is accessible to all candidates.</div>
                ) : (
                  <div className="space-y-2">
                    {accessRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <select
                          value={rule.attributeId}
                          onChange={(e) => updateAccessRule(idx, 'attributeId', e.target.value)}
                          className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        >
                          {availableAttributes.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.type})
                            </option>
                          ))}
                        </select>

                        <select
                          value={rule.operator}
                          onChange={(e) => updateAccessRule(idx, 'operator', e.target.value)}
                          className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        >
                          <option value="=">=</option>
                          <option value="!=">!=</option>
                          <option value=">">&gt;</option>
                          <option value="<">&lt;</option>
                          <option value=">=">&gt;=</option>
                          <option value="<=">&lt;=</option>
                        </select>

                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => updateAccessRule(idx, 'value', e.target.value)}
                          placeholder="Target value"
                          className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />

                        <button
                          type="button"
                          onClick={() => removeAccessRule(idx)}
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-md"
                >
                  Save Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conflict Modal */}
      <OptimisticLockModal
        isOpen={isConflictOpen}
        message={conflictMessage}
        onReload={() => {
          setIsConflictOpen(false);
          setIsModalOpen(false);
          fetchPositions();
        }}
      />
    </div>
  );
};
