import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface OptimisticLockModalProps {
  isOpen: boolean;
  onReload: () => void;
  message?: string;
}

export const OptimisticLockModal: React.FC<OptimisticLockModalProps> = ({
  isOpen,
  onReload,
  message,
}) => {
  const { t } = useThemeLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/60 rounded-full">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {t('conflictTitle')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Version mismatch detected during save
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          {message || t('conflictDesc')}
        </p>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onReload}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-md transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('reload')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
