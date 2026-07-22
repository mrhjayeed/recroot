import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Briefcase, Lock, Globe, MessageSquare, FileText, Send, UserCheck, Heart, AlertCircle, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { TableToolbar } from '../components/TableToolbar';

export const PositionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, authHeader } = useAuth();
  const { t } = useThemeLanguage();
  const navigate = useNavigate();

  const [position, setPosition] = useState<any>(null);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selection states for CVs table
  const [selectedCvIds, setSelectedCvIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'cvs' | 'discussions'>('details');

  const isRecruiterOrAdmin = user?.role === 'RECRUITER' || user?.role === 'ADMIN';

  useEffect(() => {
    if (id) {
      fetchPosition();
      fetchDiscussions();
    }
  }, [id]);

  // Real-time polling for discussions (every 3 seconds)
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => {
      fetchDiscussions();
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchPosition = async () => {
    try {
      const res = await fetch(`/api/positions/${id}`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setPosition(data.position);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDiscussions = async () => {
    try {
      const res = await fetch(`/api/positions/${id}/discussions`);
      if (res.ok) {
        const data = await res.json();
        setDiscussions(data.posts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCv = async () => {
    try {
      const res = await fetch('/api/cvs/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({ positionId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/cv/${data.cv.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to generate CV');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      const res = await fetch(`/api/positions/${id}/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({ content: commentInput }),
      });

      if (res.ok) {
        setCommentInput('');
        fetchDiscussions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="max-w-7xl mx-auto p-8 text-center text-slate-400">Loading position details...</div>;
  }

  if (!position) {
    return <div className="max-w-7xl mx-auto p-8 text-center text-slate-400">Position not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigate('/positions')}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Positions List</span>
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {position.title}
              </h1>
              {position.isPublic ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Globe className="w-3.5 h-3.5" /> Public
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <Lock className="w-3.5 h-3.5" /> Restricted Access
                </span>
              )}
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              {position.shortDescription}
            </p>
          </div>

          {/* Candidate Action */}
          {user?.role === 'CANDIDATE' && (
            <div>
              {position.isEligible ? (
                <button
                  onClick={handleCreateCv}
                  className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate / Open My CV</span>
                </button>
              ) : (
                <div className="text-right">
                  <button
                    disabled
                    className="flex items-center gap-2 bg-slate-300 dark:bg-slate-800 text-slate-500 font-semibold text-xs px-4 py-2 rounded-xl cursor-not-allowed"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>Ineligible for this Position</span>
                  </button>
                  <p className="text-[10px] text-rose-500 mt-1 max-w-xs">
                    {position.failedRules?.join(' • ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Access Rules & Tags summary */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="text-slate-500 font-semibold">
            Max Projects: <span className="text-slate-900 dark:text-white font-bold">{position.maxProjects}</span>
          </div>
          {position.projectTags?.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-semibold">Filtered Tags:</span>
              {position.projectTags.map((t: string) => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'details'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Position Template Attributes</span>
        </button>

        {isRecruiterOrAdmin && (
          <button
            onClick={() => setActiveTab('cvs')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'cvs'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Submitted CVs ({position.cvs?.length || 0})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('discussions')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'discussions'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t('discussions')} ({discussions.length})</span>
        </button>
      </div>

      {/* Tab 1: Template Attributes */}
      {activeTab === 'details' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
            Template Attributes ({position.attributes?.length || 0})
          </h3>
          {position.attributes?.length === 0 ? (
            <div className="text-xs text-slate-400">No template attributes configured.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {position.attributes?.map((attr: any) => (
                <div key={attr.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white">{attr.name}</div>
                  <div className="text-[11px] text-slate-400">Category: {attr.category?.name}</div>
                  <div className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold uppercase">{attr.type}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Submitted CVs (Recruiters & Admins) */}
      {activeTab === 'cvs' && isRecruiterOrAdmin && (
        <div className="space-y-4">
          <TableToolbar
            selectedIds={selectedCvIds}
            onClearSelection={() => setSelectedCvIds([])}
            onView={selectedCvIds.length === 1 ? () => navigate(`/cv/${selectedCvIds[0]}`) : undefined}
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="p-3.5 w-10 text-center">☐</th>
                    <th className="p-3.5">Candidate Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Likes</th>
                    <th className="p-3.5 text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {position.cvs?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No CVs submitted for this position yet.
                      </td>
                    </tr>
                  ) : (
                    position.cvs?.map((cv: any) => {
                      const isSelected = selectedCvIds.includes(cv.id);
                      return (
                        <tr
                          key={cv.id}
                          onClick={() =>
                            setSelectedCvIds((prev) =>
                              prev.includes(cv.id) ? prev.filter((i) => i !== cv.id) : [...prev, cv.id]
                            )
                          }
                          className={`hover:bg-sky-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-sky-50 dark:bg-sky-950/40' : ''
                          }`}
                        >
                          <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                setSelectedCvIds((prev) =>
                                  prev.includes(cv.id) ? prev.filter((i) => i !== cv.id) : [...prev, cv.id]
                                )
                              }
                              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            <Link
                              to={`/cv/${cv.id}`}
                              className="hover:text-sky-600 dark:hover:text-sky-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {cv.candidate?.firstName} {cv.candidate?.lastName}
                            </Link>
                          </td>
                          <td className="p-3.5 text-slate-500 font-mono">{cv.candidate?.email}</td>
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
                          <td className="p-3.5 text-center font-bold text-rose-500 flex items-center justify-center gap-1">
                            <Heart className="w-3.5 h-3.5 fill-rose-500" />
                            <span>{cv.likesCount}</span>
                          </td>
                          <td className="p-3.5 text-right font-mono text-slate-400">
                            {new Date(cv.updatedAt).toLocaleDateString()}
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
      )}

      {/* Tab 3: Discussion Board (Chronological posts, Markdown, auto-refresh) */}
      {activeTab === 'discussions' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-sky-500" />
            <span>Position Discussion Board</span>
          </h3>

          {/* Posts List */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {discussions.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">
                No discussion posts yet. Be the first to leave a comment!
              </div>
            ) : (
              discussions.map((post) => (
                <div
                  key={post.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {isRecruiterOrAdmin ? (
                          <Link
                            to={`/profile/${post.author?.id}`}
                            className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                          >
                            <span>{post.author?.firstName} {post.author?.lastName}</span>
                            <UserCheck className="w-3 h-3 text-sky-500" />
                          </Link>
                        ) : (
                          <span>{post.author?.firstName} {post.author?.lastName}</span>
                        )}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {post.author?.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="prose dark:prose-invert prose-xs text-slate-700 dark:text-slate-200">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handlePostComment} className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <textarea
                rows={3}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a message or question (Markdown formatting supported)..."
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('postComment')}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-800">
              Please <Link to="/login" className="text-sky-600 underline">Sign In</Link> to participate in discussions.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
