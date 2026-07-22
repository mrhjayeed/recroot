import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Edit3, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { TableToolbar } from '../components/TableToolbar';

export const AttributeLibraryPage: React.FC = () => {
  const { user, authHeader } = useAuth();
  const { t } = useThemeLanguage();

  const [attributes, setAttributes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<any>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formType, setFormType] = useState('STRING');
  const [formOptions, setFormOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState('');

  const isRecruiterOrAdmin = user?.role === 'RECRUITER' || user?.role === 'ADMIN';

  useEffect(() => {
    fetchAttributes();
    fetchCategories();
  }, []);

  const fetchAttributes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/attributes');
      if (res.ok) {
        const data = await res.json();
        setAttributes(data.attributes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/attributes/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        if (data.categories?.length > 0) {
          setFormCategoryId(data.categories[0].id);
        }
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
    setEditingAttr(null);
    setFormName('');
    if (categories.length > 0) setFormCategoryId(categories[0].id);
    setFormType('STRING');
    setFormOptions([]);
    setIsModalOpen(true);
  };

  const openEditModal = (attr: any) => {
    setEditingAttr(attr);
    setFormName(attr.name);
    setFormCategoryId(attr.categoryId);
    setFormType(attr.type);
    try {
      setFormOptions(JSON.parse(attr.optionsJson || '[]'));
    } catch (e) {
      setFormOptions([]);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected attribute(s)?`)) return;

    try {
      for (const id of selectedIds) {
        await fetch(`/api/attributes/${id}`, {
          method: 'DELETE',
          headers: authHeader(),
        });
      }
      fetchAttributes();
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formName,
      categoryId: formCategoryId,
      type: formType,
      options: formOptions,
    };

    try {
      const url = editingAttr ? `/api/attributes/${editingAttr.id}` : '/api/attributes';
      const method = editingAttr ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchAttributes();
        setSelectedIds([]);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save attribute');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addOption = () => {
    if (optionInput.trim() && !formOptions.includes(optionInput.trim())) {
      setFormOptions([...formOptions, optionInput.trim()]);
      setOptionInput('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Tag className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          <span>{t('attributeLibrary')}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Shared pool of reusable attributes across candidate profiles, position templates, and dynamic CVs.
        </p>
      </div>

      {/* Toolbar for row selections (No individual per-row edit/delete buttons!) */}
      <TableToolbar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onEdit={isRecruiterOrAdmin && selectedIds.length === 1 ? () => {
          const target = attributes.find((a) => a.id === selectedIds[0]);
          if (target) openEditModal(target);
        } : undefined}
        onDelete={isRecruiterOrAdmin && selectedIds.length > 0 ? handleDelete : undefined}
        onCreateNew={isRecruiterOrAdmin ? openCreateModal : undefined}
        createLabel={t('actionCreateAttribute')}
      />

      {/* Attribute Library Table View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <th className="p-3.5 w-10 text-center">☐</th>
                <th className="p-3.5">Attribute Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Data Type</th>
                <th className="p-3.5">Dropdown Options</th>
                <th className="p-3.5 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    Loading attributes library...
                  </td>
                </tr>
              ) : attributes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    {t('emptyList')}
                  </td>
                </tr>
              ) : (
                attributes.map((attr) => {
                  const isSelected = selectedIds.includes(attr.id);
                  let opts: string[] = [];
                  try {
                    opts = JSON.parse(attr.optionsJson || '[]');
                  } catch (e) {}

                  return (
                    <tr
                      key={attr.id}
                      onClick={() => toggleSelectRow(attr.id)}
                      className={`hover:bg-sky-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-sky-50 dark:bg-sky-950/40' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(attr.id)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {attr.name}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">
                        {attr.category?.name}
                      </td>
                      <td className="p-3.5 font-mono text-sky-600 dark:text-sky-400 uppercase font-bold">
                        {attr.type}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {attr.type === 'DROPDOWN' ? (
                          <div className="flex flex-wrap gap-1">
                            {opts.map((o) => (
                              <span key={o} className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium">
                                {o}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-400">
                        {new Date(attr.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attribute Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingAttr ? 'Edit Attribute' : 'Create Attribute'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveAttribute} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Globally Unique Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. IELTS Score"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Category *</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Attribute Data Type *</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                >
                  <option value="STRING">String (Single line)</option>
                  <option value="TEXT">Text (Markdown)</option>
                  <option value="NUMERIC">Numeric</option>
                  <option value="DATE">Date</option>
                  <option value="PERIOD">Period (Date range)</option>
                  <option value="BOOLEAN">Boolean (Checkbox)</option>
                  <option value="DROPDOWN">Dropdown (One of many)</option>
                  <option value="IMAGE">Image (URL)</option>
                </select>
              </div>

              {formType === 'DROPDOWN' && (
                <div>
                  <label className="block font-semibold mb-1">Dropdown Options</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      placeholder="Add option (e.g. Advanced)"
                      className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={addOption}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-xl font-semibold"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formOptions.map((opt) => (
                      <span key={opt} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-semibold">
                        {opt}
                        <button type="button" onClick={() => setFormOptions(formOptions.filter((o) => o !== opt))}>
                          <X className="w-3 h-3 hover:text-rose-600" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold">
                  Save Attribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
