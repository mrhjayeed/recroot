import React from 'react';
import { Eye, Edit, Trash2, Copy, CheckCircle, Plus } from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface TableToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
  onCreateNew?: () => void;
  createLabel?: string;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  selectedIds,
  onClearSelection,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onPublish,
  onCreateNew,
  createLabel,
}) => {
  const { t } = useThemeLanguage();
  const count = selectedIds.length;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-all">
      {/* Contextual Toolbar when items are selected */}
      {count > 0 ? (
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold text-xs">
              {count}
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t('itemsSelected')}
            </span>
            <button
              onClick={onClearSelection}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline ml-1"
            >
              Clear
            </button>
          </div>

          {/* Context Actions */}
          <div className="flex items-center gap-1.5">
            {count === 1 && onView && (
              <button
                onClick={onView}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t('actionView')}</span>
              </button>
            )}

            {count === 1 && onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{t('actionEdit')}</span>
              </button>
            )}

            {count === 1 && onDuplicate && (
              <button
                onClick={onDuplicate}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{t('actionDuplicate')}</span>
              </button>
            )}

            {onPublish && (
              <button
                onClick={onPublish}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{t('actionPublish')}</span>
              </button>
            )}

            {onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('actionDelete')}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Select rows using checkboxes to reveal contextual toolbar actions.</span>
        </div>
      )}

      {/* Primary Action Button (e.g. Create Position / Add Attribute) */}
      {onCreateNew && (
        <button
          onClick={onCreateNew}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors ml-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{createLabel || 'Create New'}</span>
        </button>
      )}
    </div>
  );
};
