import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listUsers,
  updateUser,
  deleteUser,
  createUserWithRole,
  type ApiUser,
  type Role
} from '@/api/users';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, Trash2, UserPlus, X } from 'lucide-react';

export default function AdminUsers() {
  const qc = useQueryClient();
  const { notify } = useToast();

  const [q, setQ] = useState('');
  const usersQ = useQuery({ queryKey: ['admin-users'], queryFn: () => listUsers(0, 200) });

  const filtered = useMemo(() => {
    const list = usersQ.data ?? [];
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter(u =>
      [u.email, u.username, u.display_name, u.role].filter(Boolean)
        .some(x => String(x).toLowerCase().includes(t))
    );
  }, [usersQ.data, q]);

  const roleMut = useMutation({
    mutationFn: ({ user_id, role }: { user_id: number; role: Role }) => updateUser(user_id, { role }),
    onSuccess: () => {
      notify('Role updated.', 'success');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => {
      notify(e?.response?.data?.detail || 'Failed to update role', 'error');
    }
  });

  const delMut = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      notify('User deleted.', 'success');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => {
      notify(e?.response?.data?.detail || 'Failed to delete user', 'error');
    }
  });

  // Create slide-over state
  const [openCreate, setOpenCreate] = useState(false);
  const [newUser, setNewUser] = useState<{email: string; username: string; password: string; role: Role}>({
    email: '', username: '', password: '', role: 'consumer'
  });
  const createMut = useMutation({
    mutationFn: () => createUserWithRole(newUser),
    onSuccess: () => {
      notify('User created.', 'success');
      setOpenCreate(false);
      setNewUser({ email: '', username: '', password: '', role: 'consumer' });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => {
      notify(e?.response?.data?.detail || 'Failed to create user', 'error');
    }
  });

  return (
    <div className="bg-radial-vignette">
      <header className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="display text-3xl text-white">Admin · Users</h1>
            <p className="mt-1 text-sm text-neutral-400">Manage accounts and roles.</p>
          </div>
          <Button onClick={() => setOpenCreate(true)}>
            <span className="inline-flex items-center gap-2">
              <UserPlus size={16}/> New user
            </span>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-4">
        {/* Search */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex w-full items-center gap-2 rounded-2xl border border-brand-line bg-black/40 px-3 py-2">
            <Search size={16} className="text-neutral-500" />
            <input
              className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none"
              placeholder="Search by email, username, role…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-brand-line bg-brand-card">
          <div className="grid grid-cols-12 gap-2 border-b border-brand-line/60 px-3 py-2 text-xs text-neutral-400">
            <div className="col-span-4">User</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          {usersQ.status === 'pending' ? (
            <div className="flex items-center justify-center p-6">
              <Spinner label="Loading users…" />
            </div>
          ) : (
            <div className="divide-y divide-brand-line/60">
              {filtered.map(u => (
                <div key={u.user_id} className="grid grid-cols-12 items-center gap-2 px-3 py-3">
                  <div className="col-span-4 min-w-0">
                    <div className="truncate text-sm text-white">{u.username}</div>
                    <div className="truncate text-xs text-neutral-400">ID: {u.user_id}</div>
                  </div>
                  <div className="col-span-3 truncate text-sm text-neutral-200">{u.email}</div>
                  <div className="col-span-2">
                    <RoleSelect
                      value={u.role}
                      onChange={(role) => roleMut.mutate({ user_id: u.user_id, role })}
                      disabled={roleMut.isPending}
                    />
                  </div>
                  <div className="col-span-3 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        if (confirm(`Delete user "${u.username}"? This cannot be undone.`)) delMut.mutate(u.user_id);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-brand-line bg-black/30 px-2 py-1 text-xs text-red-300 hover:bg-white/5"
                    >
                      <Trash2 size={14}/> Delete
                    </button>
                  </div>
                </div>
              ))}

              {usersQ.status === 'success' && filtered.length === 0 && (
                <div className="p-6 text-center text-sm text-neutral-400">No users.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create slide-over */}
      <AnimatePresence>
        {openCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => setOpenCreate(false)}
          >
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="absolute right-0 top-0 h-full w-full max-w-md overflow-auto border-l border-brand-line bg-brand-card p-4 shadow-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="display text-2xl text-white">Create user</h2>
                <button onClick={() => setOpenCreate(false)} className="rounded-xl p-1 hover:bg-white/5">
                  <X size={18} />
                </button>
              </div>

              <p className="mt-1 text-sm text-neutral-400">Admins can create users with any role.</p>

              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }}
              >
                <Field label="Email" value={newUser.email} onChange={(v) => setNewUser(s => ({ ...s, email: v }))} required />
                <Field label="Username" value={newUser.username} onChange={(v) => setNewUser(s => ({ ...s, username: v }))} required />
                <Field label="Password" type="password" value={newUser.password} onChange={(v) => setNewUser(s => ({ ...s, password: v }))} required />
                <label className="mb-1 block text-xs text-neutral-400">Role</label>
                <div className="rounded-2xl border border-brand-line bg-black/40 p-2">
                  <RoleSelect value={newUser.role} onChange={(role) => setNewUser(s => ({ ...s, role }))} />
                </div>

                <Button type="submit" isLoading={createMut.isPending} className="w-full">
                  Create user
                </Button>
              </form>

              <div className="mt-4 inline-flex items-center gap-2 text-xs text-neutral-400">
                <Shield size={14} className="text-brand-red" /> Admin only area
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label, value, onChange, type, required
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">{label}</label>
      <input
        type={type || 'text'}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-brand-line bg-black/40 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-brand-red/60"
      />
    </div>
  );
}

function RoleSelect({
  value, onChange, disabled
}: { value: Role; onChange: (r: Role) => void; disabled?: boolean }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as Role)}
      className="w-full rounded-xl border border-brand-line bg-black/40 px-2 py-2 text-xs text-neutral-100 outline-none focus:ring-2 focus:ring-brand-red/60"
    >
      <option value="consumer">consumer</option>
      <option value="creator">creator</option>
      <option value="admin">admin</option>
    </select>
  );
}
