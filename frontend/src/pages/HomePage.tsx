import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, Users, FileText, CheckCircle2, TrendingUp, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useAuth } from '../context/AuthContext';
import { TableToolbar } from '../components/TableToolbar';

export const HomePage: React.FC = () => {
  const { t } = useThemeLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [latestPositions, setLatestPositions] = useState<any[]>([]);
  const [popularPositions, setPopularPositions] = useState<any[]>([]);
  const [tagCloud, setTagCloud] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selection states for tables (NO in-row buttons per spec)
  const [selectedLatestIds, setSelectedLatestIds] = useState<string[]>([]);
  const [selectedPopularIds, setSelectedPopularIds] = useState<string[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setLatestPositions(data.latestPositions || []);
        setPopularPositions(data.popularPositions || []);
        setTagCloud(data.tagCloud || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectLatest = (id: string) => {
    setSelectedLatestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectPopular = (id: string) => {
    setSelectedPopularIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen CV & Position Alignment Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Build Tailored CVs from Reusable Attributes
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Recroot dynamically connects recruiter position templates with candidate profile attributes. Manage reusable skills, create custom positions, and generate tailored CVs in real time.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/positions"
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-colors"
            >
              <span>Explore Positions</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!user && (
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-colors"
              >
                <span>Register Account</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Public System Statistics Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-500" />
          <span>Public Statistics</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                {stats?.cvsCreated24h ?? 0}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {t('statCvs24h')}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                {stats?.totalPositions ?? 0}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {t('statPositions')}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                {stats?.candidateCount ?? 0}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {t('statCandidates')}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                {stats?.recruiterCount ?? 0}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {t('statRecruiters')}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                {stats?.totalSubmittedCvs ?? 0}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {t('statSubmittedCvs')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Positions Table View (Strict Table Layout with Top Appearing Toolbar, NO buttons in rows!) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-sky-500" />
            <span>{t('latestPositions')}</span>
          </h2>
          <Link to="/positions" className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium">
            View All Positions →
          </Link>
        </div>

        <TableToolbar
          selectedIds={selectedLatestIds}
          onClearSelection={() => setSelectedLatestIds([])}
          onView={selectedLatestIds.length === 1 ? () => navigate(`/positions/${selectedLatestIds[0]}`) : undefined}
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="p-3.5 w-10 text-center">☐</th>
                  <th className="p-3.5">Position Title</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Created By</th>
                  <th className="p-3.5 text-center">Submitted CVs</th>
                  <th className="p-3.5 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {latestPositions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      {t('emptyList')}
                    </td>
                  </tr>
                ) : (
                  latestPositions.map((pos) => {
                    const isSelected = selectedLatestIds.includes(pos.id);
                    return (
                      <tr
                        key={pos.id}
                        onClick={() => toggleSelectLatest(pos.id)}
                        className={`hover:bg-sky-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-50 dark:bg-sky-950/40' : ''
                        }`}
                      >
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectLatest(pos.id)}
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          />
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          <Link
                            to={`/positions/${pos.id}`}
                            className="hover:text-sky-600 dark:hover:text-sky-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {pos.title}
                          </Link>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {pos.shortDescription}
                        </td>
                        <td className="p-3.5 text-slate-500 dark:text-slate-400 font-medium">
                          {pos.createdByName}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                            {pos.submittedCvCount}
                          </span>
                        </td>
                        <td className="p-3.5 text-right text-slate-400 font-mono">
                          {new Date(pos.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Most Popular Positions Table View */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>{t('popularPositions')} (Top 5 Ranked by Submitted CVs)</span>
          </h2>
        </div>

        <TableToolbar
          selectedIds={selectedPopularIds}
          onClearSelection={() => setSelectedPopularIds([])}
          onView={selectedPopularIds.length === 1 ? () => navigate(`/positions/${selectedPopularIds[0]}`) : undefined}
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="p-3.5 w-10 text-center">☐</th>
                  <th className="p-3.5">Rank</th>
                  <th className="p-3.5">Position Title</th>
                  <th className="p-3.5">Short Description</th>
                  <th className="p-3.5 text-center font-bold">Total CVs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {popularPositions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      {t('emptyList')}
                    </td>
                  </tr>
                ) : (
                  popularPositions.map((pos, idx) => {
                    const isSelected = selectedPopularIds.includes(pos.id);
                    return (
                      <tr
                        key={pos.id}
                        onClick={() => toggleSelectPopular(pos.id)}
                        className={`hover:bg-sky-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-50 dark:bg-sky-950/40' : ''
                        }`}
                      >
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectPopular(pos.id)}
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          />
                        </td>
                        <td className="p-3.5 font-extrabold text-slate-400">
                          #{idx + 1}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          <Link
                            to={`/positions/${pos.id}`}
                            className="hover:text-sky-600 dark:hover:text-sky-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {pos.title}
                          </Link>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {pos.shortDescription}
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-emerald-600 dark:text-emerald-400">
                          {pos.submittedCvCount}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Technology Tag Cloud */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Tag className="w-4 h-4 text-purple-500" />
          <span>{t('tagCloud')}</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {tagCloud.length === 0 ? (
            <div className="text-xs text-slate-400">No technology tags available yet.</div>
          ) : (
            tagCloud.map((item) => (
              <Link
                key={item.tag}
                to={`/search?q=${encodeURIComponent(item.tag)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 hover:border-sky-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all hover:scale-105"
              >
                <span>#{item.tag}</span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-full font-bold text-slate-500 dark:text-slate-400">
                  {item.count}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
