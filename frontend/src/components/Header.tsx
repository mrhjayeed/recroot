import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Globe, User as UserIcon, LogOut, ShieldCheck, Briefcase, FileText, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t } = useThemeLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:bg-sky-500 transition-colors">
            R
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            Rec<span className="text-sky-600 dark:text-sky-400">root</span>
          </span>
        </Link>

        {/* Global Full-Text Search Input (Requirement: Available on every page) */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-slate-100 transition-colors"
            />
          </div>
        </form>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          <Link to="/" className="px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {t('navHome')}
          </Link>
          <Link to="/positions" className="px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {t('navPositions')}
          </Link>
          {(user?.role === 'RECRUITER' || user?.role === 'ADMIN') && (
            <Link to="/attributes" className="px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {t('navAttributes')}
            </Link>
          )}
          {isAuthenticated && (
            <Link to={`/profile/${user?.id}`} className="px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {t('navProfile')}
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link to="/admin/users" className="px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-600 dark:text-purple-400 font-semibold transition-colors">
              {t('navAdminUsers')}
            </Link>
          )}
        </nav>

        {/* Controls & Auth */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Toggle UI Language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'EN' : 'বাংলা'}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* User Auth */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3 ml-2 border-l border-slate-200 dark:border-slate-800 pl-3">
              {/* Role badge */}
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                user?.role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                  : user?.role === 'RECRUITER'
                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              }`}>
                {user?.role === 'ADMIN' ? t('roleAdmin') : user?.role === 'RECRUITER' ? t('roleRecruiter') : t('roleCandidate')}
              </span>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title={t('navLogout')}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('navLogout')}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link
                to="/login"
                className="text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                {t('navLogin')}
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-sky-600 text-white hover:bg-sky-500 shadow-sm transition-colors"
              >
                {t('navRegister')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
