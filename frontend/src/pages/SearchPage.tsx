import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Briefcase, FileText, Tag, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { authHeader } = useAuth();

  const [results, setResults] = useState<any>({ positions: [], cvs: [], attributes: [], profiles: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query) fetchSearch();
  }, [query]);

  const fetchSearch = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        headers: authHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Search className="w-6 h-6 text-sky-600" />
          <span>Search Results for "{query}"</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Full-text query results across positions, CVs, attributes, and user profiles.
        </p>
      </div>

      {isLoading ? (
        <div className="text-slate-400 text-center py-8">Searching database...</div>
      ) : (
        <div className="space-y-8">
          {/* Matched Positions */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-sky-500" />
              <span>Matching Positions ({results.positions?.length || 0})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.positions?.map((p: any) => (
                <Link
                  key={p.id}
                  to={`/positions/${p.id}`}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-sky-500 shadow-sm transition-all text-xs space-y-1 block"
                >
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{p.title}</div>
                  <div className="text-slate-500 truncate">{p.shortDescription}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Matched CVs */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Matching CVs ({results.cvs?.length || 0})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.cvs?.map((c: any) => (
                <Link
                  key={c.id}
                  to={`/cv/${c.id}`}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-emerald-500 shadow-sm transition-all text-xs space-y-1 block"
                >
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{c.candidateName}</div>
                  <div className="text-slate-500">Position: {c.positionTitle}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Matched Attributes */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-500" />
              <span>Matching Library Attributes ({results.attributes?.length || 0})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {results.attributes?.map((a: any) => (
                <div key={a.id} className="p-3 bg-white dark:bg-slate-900 border rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white">{a.name}</div>
                  <div className="text-slate-400">{a.category?.name} • {a.type}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Matched Profiles */}
          {results.profiles?.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                <span>Matching Profiles ({results.profiles.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {results.profiles.map((pr: any) => (
                  <Link
                    key={pr.id}
                    to={`/profile/${pr.id}`}
                    className="p-3 bg-white dark:bg-slate-900 border rounded-2xl hover:border-amber-500 text-xs block space-y-1"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">{pr.firstName} {pr.lastName}</div>
                    <div className="text-slate-400 font-mono">{pr.email}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
