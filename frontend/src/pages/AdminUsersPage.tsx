import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserX, UserCheck, Trash2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { TableToolbar } from '../components/TableToolbar';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser, authHeader, refreshUser } = useAuth();
  const { t } = useThemeLanguage();

  const [users, setUsers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/users', { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleBlock = async (isBlocked: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      for (const id of selectedIds) {
        await fetch(`/api/auth/users/${id}/block`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader(),
          },
          body: JSON.stringify({ isBlocked }),
        });
      }
      fetchUsers();
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeRole = async (role: string) => {
    if (selectedIds.length !== 1) return;
    const targetId = selectedIds[0];
    if (targetId === currentUser?.id && role !== 'ADMIN') {
      if (!window.confirm('WARNING: Removing your own Administrator role will revoke access to Admin tools! Proceed?')) {
        return;
      }
    }

    try {
      const res = await fetch(`/api/auth/users/${targetId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        fetchUsers();
        if (targetId === currentUser?.id) {
          refreshUser();
        }
        setSelectedIds([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} user account(s)?`)) return;

    try {
      for (const id of selectedIds) {
        await fetch(`/api/auth/users/${id}`, {
          method: 'DELETE',
          headers: authHeader(),
        });
      }
      fetchUsers();
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <span>{t('userManagement')}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Administrator controls for user accounts, status blocking, and role assignments.
        </p>
      </div>

      {/* Toolbar for row selections */}
      <TableToolbar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onDelete={selectedIds.length > 0 ? handleDelete : undefined}
      />

      {/* Role Change & Block Actions Bar for Selected User */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-bold text-purple-900 dark:text-purple-200">
            Admin Bulk Actions for {selectedIds.length} selected user(s):
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleBlock(true)}
              className="px-3 py-1.5 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-500"
            >
              Block Account
            </button>
            <button
              onClick={() => handleToggleBlock(false)}
              className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500"
            >
              Unblock Account
            </button>
            {selectedIds.length === 1 && (
              <div className="flex items-center gap-1 border-l border-purple-300 pl-2">
                <span className="font-semibold text-purple-700 dark:text-purple-300">Set Role:</span>
                <button
                  onClick={() => handleChangeRole('CANDIDATE')}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-semibold"
                >
                  Candidate
                </button>
                <button
                  onClick={() => handleChangeRole('RECRUITER')}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-semibold"
                >
                  Recruiter
                </button>
                <button
                  onClick={() => handleChangeRole('ADMIN')}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-semibold"
                >
                  Admin
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Table View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <th className="p-3.5 w-10 text-center">☐</th>
                <th className="p-3.5">User Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5 font-center">Role</th>
                <th className="p-3.5 text-center">Account Status</th>
                <th className="p-3.5 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    Loading users list...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    {t('emptyList')}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelected = selectedIds.includes(u.id);
                  return (
                    <tr
                      key={u.id}
                      onClick={() => toggleSelectRow(u.id)}
                      className={`hover:bg-purple-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-purple-50 dark:bg-purple-950/40' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(u.id)}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {u.firstName} {u.lastName}
                        {u.id === currentUser?.id && (
                          <span className="ml-2 text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-mono">
                            (You)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">{u.email}</td>
                      <td className="p-3.5">
                        <span className="font-extrabold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {u.isBlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            <UserX className="w-3 h-3" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <UserCheck className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
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
  );
};
