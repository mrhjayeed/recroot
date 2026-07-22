import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FileText, Heart, CheckCircle2, AlertCircle, ArrowLeft, Edit3, Save, Sparkles, UserCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { OptimisticLockModal } from '../components/OptimisticLockModal';

export const CVDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, authHeader } = useAuth();
  const { t } = useThemeLanguage();
  const navigate = useNavigate();

  const [cvData, setCvData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // In-place attribute editing state
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState<string>('');

  // Conflict modal
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [conflictMsg, setConflictMsg] = useState('');

  const isRecruiterOrAdmin = user?.role === 'RECRUITER' || user?.role === 'ADMIN';

  useEffect(() => {
    if (id) fetchCV();
  }, [id]);

  const fetchCV = async () => {
    try {
      const res = await fetch(`/api/cvs/${id}`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setCvData(data.cv);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to load CV');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInPlaceSaveAttribute = async (attr: any) => {
    try {
      const res = await fetch(`/api/cvs/${id}/attribute`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({
          attributeId: attr.attributeId,
          value: editingVal,
          version: attr.version,
        }),
      });

      if (res.status === 409) {
        const err = await res.json();
        setConflictMsg(err.error || t('conflictDesc'));
        setIsConflictOpen(true);
        return;
      }

      if (res.ok) {
        setEditingAttrId(null);
        fetchCV();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePublish = async () => {
    const nextStatus = cvData.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await fetch(`/api/cvs/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        fetchCV();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleLike = async () => {
    try {
      const res = await fetch(`/api/cvs/${id}/like`, {
        method: 'POST',
        headers: authHeader(),
      });
      if (res.ok) {
        fetchCV();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto p-8 text-center text-slate-400">Rendering generated CV...</div>;
  }

  if (!cvData) {
    return <div className="max-w-4xl mx-auto p-8 text-center text-slate-400">CV not found.</div>;
  }

  const { candidate, position, attributes, projects, canEdit, isReadOnly, status, likesCount, isLikedByMe, hasEmptyField } = cvData;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Navigation & Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
              status === 'PUBLISHED'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
            }`}
          >
            {status === 'PUBLISHED' ? t('statusPublished') : t('statusDraft')}
          </span>

          {/* Toggle Publish button */}
          {canEdit && (
            <button
              onClick={handleTogglePublish}
              className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-xl shadow-sm transition-colors ${
                status === 'PUBLISHED'
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{status === 'PUBLISHED' ? 'Unpublish (Make Draft)' : 'Publish CV'}</span>
            </button>
          )}

          {/* Recruiter Like Button */}
          {isRecruiterOrAdmin && (
            <button
              onClick={handleToggleLike}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                isLikedByMe
                  ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-rose-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLikedByMe ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{isLikedByMe ? t('liked') : t('like')} ({likesCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Styled Printable CV Document Card */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-8 transition-all">
        {/* CV Header Section */}
        <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-6 flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <h1 className="cv-font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {candidate.firstName} {candidate.lastName}
            </h1>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 font-mono">
              Target Position: <span className="text-sky-600 dark:text-sky-400 font-bold">{position.title}</span>
            </div>
            {candidate.location && (
              <div className="text-xs text-slate-400">{candidate.location} • {candidate.email}</div>
            )}
          </div>

          <img
            src={candidate.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
            alt="Candidate Avatar"
            className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-900 dark:border-slate-100 shadow-md"
          />
        </div>

        {/* Highlight Banner if Empty attributes exist */}
        {hasEmptyField && canEdit && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300 font-semibold">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>Some position attributes are empty (highlighted in red below). Click directly on empty fields to fill in values.</span>
          </div>
        )}

        {/* Section 1: Position Template Attributes (In-place editable, Red highlight when empty) */}
        <div className="space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1">
            Core Position Attributes & Skills
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {attributes.map((attr: any) => {
              const isEditing = editingAttrId === attr.attributeId;

              return (
                <div
                  key={attr.attributeId}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    attr.isEmpty
                      ? 'empty-field-highlight'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {attr.name}
                    </span>
                    <span className="text-[10px] text-slate-400">({attr.categoryName})</span>
                  </div>

                  {/* In-place Editing Control */}
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-2">
                      {attr.type === 'BOOLEAN' ? (
                        <select
                          value={editingVal}
                          onChange={(e) => setEditingVal(e.target.value)}
                          className="text-xs p-1 bg-white dark:bg-slate-900 border rounded"
                        >
                          <option value="true">Yes / True</option>
                          <option value="false">No / False</option>
                        </select>
                      ) : attr.type === 'DROPDOWN' ? (
                        <select
                          value={editingVal}
                          onChange={(e) => setEditingVal(e.target.value)}
                          className="text-xs p-1 bg-white dark:bg-slate-900 border rounded"
                        >
                          <option value="">-- Select --</option>
                          {attr.options?.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={attr.type === 'NUMERIC' ? 'number' : 'text'}
                          value={editingVal}
                          onChange={(e) => setEditingVal(e.target.value)}
                          className="text-xs px-2 py-1 bg-white dark:bg-slate-900 border rounded flex-1"
                        />
                      )}

                      <button
                        onClick={() => handleInPlaceSaveAttribute(attr)}
                        className="p-1 bg-sky-600 text-white rounded font-semibold text-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingAttrId(null)}
                        className="p-1 bg-slate-200 text-slate-600 rounded text-xs"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-sm font-semibold">
                        {attr.isEmpty ? (
                          <span className="italic">[Empty — Click edit to enter value]</span>
                        ) : (
                          <span>{attr.value}</span>
                        )}
                      </div>

                      {canEdit && (
                        <button
                          onClick={() => {
                            setEditingAttrId(attr.attributeId);
                            setEditingVal(attr.value);
                          }}
                          className="p-1 text-slate-400 hover:text-sky-600"
                          title="In-place Edit (Updates Candidate Profile Master Value)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Candidate Projects (Filtered by Position Tags & Max Projects) */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1">
            Relevant Projects & Experience (Filtered by Position Tags)
          </h2>

          {projects.length === 0 ? (
            <div className="text-xs text-slate-400">No matching projects found for this position's tags.</div>
          ) : (
            <div className="space-y-4">
              {projects.map((proj: any) => (
                <div key={proj.id} className="space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white">
                    <span>{proj.name}</span>
                    <span className="text-xs text-slate-400 font-mono font-normal">
                      {proj.startDate} — {proj.endDate || 'Present'}
                    </span>
                  </div>

                  <div className="prose dark:prose-invert prose-xs text-slate-700 dark:text-slate-300">
                    <ReactMarkdown>{proj.description}</ReactMarkdown>
                  </div>

                  {proj.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {proj.tags.map((t: string) => (
                        <span key={t} className="px-2 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conflict Modal */}
      <OptimisticLockModal
        isOpen={isConflictOpen}
        message={conflictMsg}
        onReload={() => {
          setIsConflictOpen(false);
          fetchCV();
        }}
      />
    </div>
  );
};
