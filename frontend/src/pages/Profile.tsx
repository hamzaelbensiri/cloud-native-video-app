import React from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Mail, Shield, User2, Crown } from 'lucide-react';

import { setMyRole } from '@/api/users';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/Toast';
import type { User as ApiUser } from '@/types/api';

/**
 * Netflix-styled profile page.
 * - Shows avatar initials, display name/username, email, and current role badge.
 * - Lets user switch between consumer <-> creator (no admin switching).
 * - No user_id is shown anywhere.
 */
export default function Profile() {
  const { user, role } = useAuth();
  const { notify } = useToast();

  // Narrow the unknown shape from AuthContext to our API User shape safely
  const apiUser = (user ?? null) as Partial<ApiUser> | null;

  const displayName = apiUser?.display_name || apiUser?.username || 'You';
  const email = apiUser?.email || '';
  const username = apiUser?.username || '';

  const initials = getInitials(displayName);

  const toCreator = useMutation({
    mutationFn: () => setMyRole('creator'),
    onSuccess: () => {
      notify('Role updated to Creator. Reloading…', 'success');
      window.location.reload();
    },
    onError: (e: any) => notify(e?.response?.data?.detail || 'Failed to switch role', 'error'),
  });

  const toConsumer = useMutation({
    mutationFn: () => setMyRole('consumer'),
    onSuccess: () => {
      notify('Role updated to Consumer. Reloading…', 'success');
      window.location.reload();
    },
    onError: (e: any) => notify(e?.response?.data?.detail || 'Failed to switch role', 'error'),
  });

  return (
    <div className="bg-radial-vignette">
      <header className="mx-auto max-w-5xl px-4 pt-8">
        <h1 className="display text-3xl text-white">Your Profile</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Manage your account and role. Your ID is hidden for privacy.
        </p>
      </header>

      <div className="mx-auto max-w-5xl p-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          {/* Profile card */}
          <section className="rounded-2xl border border-brand-line bg-brand-card/80 p-5 shadow-card backdrop-blur lg:col-span-2">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {/* Avatar */}
              <div className="relative grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-neutral-800 to-black ring-1 ring-white/10">
                <span className="select-none text-2xl font-semibold text-white">{initials}</span>
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
              </div>

              {/* Identity */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-semibold text-white">
                    {displayName}
                  </h2>
                  <RoleBadge role={role} />
                </div>

                {username && (
                  <p className="mt-0.5 text-sm text-neutral-400 inline-flex items-center gap-2">
                    <User2 size={14} className="text-neutral-500" />
                    <span className="truncate">{username}</span>
                  </p>
                )}

                {email && (
                  <p className="mt-1 text-sm text-neutral-400 inline-flex items-center gap-2">
                    <Mail size={14} className="text-neutral-500" />
                    <span className="truncate">{email}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Little note */}
            <div className="mt-4 rounded-xl border border-brand-line/60 bg-black/30 p-3 text-xs text-neutral-400">
              We don’t show your internal ID here. Need account help? Contact an admin.
            </div>
          </section>

          {/* Role switcher */}
          <section className="rounded-2xl border border-brand-line bg-brand-card/80 p-5 shadow-card backdrop-blur">
            <div className="inline-flex items-center gap-2">
              <Shield size={16} className="text-brand-red" />
              <h3 className="text-sm font-semibold text-white">Role</h3>
            </div>

            <p className="mt-1 text-xs text-neutral-400">
              Switch between <span className="text-neutral-300">Consumer</span> and{' '}
              <span className="text-neutral-300">Creator</span>. Admin role is managed by administrators.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <Button
                onClick={() => toCreator.mutate()}
                disabled={role === 'creator' || role === 'admin' || toCreator.isPending}
                isLoading={toCreator.isPending}
                className="justify-center"
              >
                Become a Creator
              </Button>
              <Button
                variant="secondary"
                onClick={() => toConsumer.mutate()}
                disabled={role === 'consumer' || role === 'admin' || toConsumer.isPending}
                isLoading={toConsumer.isPending}
                className="justify-center"
              >
                Switch to Consumer
              </Button>

              {role === 'admin' && (
                <div className="mt-2 rounded-xl border border-amber-500/40 bg-amber-950/30 p-2 text-xs text-amber-200">
                  You are an <span className="font-semibold">Admin</span>. Role switching is disabled.
                </div>
              )}
            </div>
          </section>
        </motion.div>

        {/* Creator perks hint */}
        {role !== 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="mt-4 overflow-hidden rounded-2xl border border-brand-line bg-gradient-to-r from-black/50 via-black/30 to-black/50 p-[1px]"
          >
            <div className="rounded-2xl bg-brand-card/80 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-white">
                <Crown size={16} className="text-brand-red" />
                <h4 className="text-sm font-semibold">Creator perks</h4>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                Upload videos, edit metadata, and manage your library. Switch anytime.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role?: string | null }) {
  if (!role) return null;
  const label = role.charAt(0).toUpperCase() + role.slice(1);
  return (
    <span className="rounded-full border border-brand-line bg-black/30 px-2 py-0.5 text-[11px] font-medium text-neutral-200">
      {label}
    </span>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || 'U';
}
