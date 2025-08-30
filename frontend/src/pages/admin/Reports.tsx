import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listUsers } from '@/api/users';
import { fetchVideos } from '@/api/videos';
import { api } from '@/api/client';
import Spinner from '@/components/Spinner';
import { Server, UsersRound, Video, Activity, AlertTriangle } from 'lucide-react';

type DebugAny = Record<string, any>;

async function fetchDebugSettings(): Promise<DebugAny> {
  // Try both routes to avoid backend path variations / trailing-slash issues
  const paths = ['/debug-settings', '/debug-settings/'];
  let lastErr: any;
  for (const p of paths) {
    try {
      const { data } = await api.get<DebugAny>(p);
      return data || {};
    } catch (e) {
      lastErr = e;
    }
  }
  // If not available, return empty object so UI can degrade gracefully
  return {};
}

function pickEnv(dbg: DebugAny) {
  // accept case / naming variants
  const ENV =
    dbg.ENV ?? dbg.env ?? dbg.Environment ?? dbg.environment ?? null;
  const UPLOAD_DIR =
    dbg.UPLOAD_DIR ?? dbg.upload_dir ?? dbg.uploadDir ?? dbg.uploadDirectory ?? null;
  const DATABASE_URL =
    dbg.DATABASE_URL ?? dbg.database_url ?? dbg.databaseUrl ?? null;

  // mask DB string if present
  const maskedDb = typeof DATABASE_URL === 'string'
    ? DATABASE_URL.replace(/:\/\/.*@/, '://***:***@')
    : null;

  return { ENV, UPLOAD_DIR, DATABASE_URL: maskedDb };
}

export default function AdminReports() {
  const dbgQ = useQuery({ queryKey: ['debug-settings'], queryFn: fetchDebugSettings });
  const usersQ = useQuery({ queryKey: ['reports-users'], queryFn: () => listUsers(0, 200) });
  const vidsQ  = useQuery({ queryKey: ['reports-videos'], queryFn: () => fetchVideos(0, 200) });

  const loading = dbgQ.isPending || usersQ.isPending || vidsQ.isPending;

  const env = pickEnv(dbgQ.data || {});
  const dbgUnavailable = !env.ENV && !env.UPLOAD_DIR; // endpoint likely missing

  return (
    <div className="bg-radial-vignette">
      <header className="mx-auto max-w-6xl px-4 pt-6">
        <h1 className="display text-3xl text-white">Admin · Reports</h1>
        <p className="mt-1 text-sm text-neutral-400">Quick status and counts. Expand later with analytics.</p>
      </header>

      <div className="mx-auto max-w-6xl p-4">
        {dbgUnavailable && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle size={14} />
            <span>Debug endpoint not available. Environment values may be blank.</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-10">
            <Spinner label="Loading…" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card
              title="Environment"
              icon={<Server className="text-brand-red" size={18} />}
              lines={[
                ['ENV', env.ENV ?? '—'],
                ['Upload Dir', env.UPLOAD_DIR ?? '—'],
                ...(env.DATABASE_URL ? [['Database', env.DATABASE_URL]] as [string, string][] : []),
              ]}
            />
            <Card
              title="Users"
              icon={<UsersRound className="text-brand-red" size={18} />}
              big={String(usersQ.data?.length ?? 0)}
              lines={[
                ['Loaded (page)', String(usersQ.data?.length ?? 0)],
              ]}
            />
            <Card
              title="Videos"
              icon={<Video className="text-brand-red" size={18} />}
              big={String(vidsQ.data?.length ?? 0)}
              lines={[
                ['Loaded (page)', String(vidsQ.data?.length ?? 0)],
              ]}
            />
            <Card
              title="Activity"
              icon={<Activity className="text-brand-red" size={18} />}
              lines={[
                ['Tip', 'Add ratings/comments charts later'],
                ['API', '/debug-settings, /users, /videos'],
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Card({
  title, icon, big, lines
}: {
  title: string;
  icon: React.ReactNode;
  big?: string;
  lines?: [string, string][];
}) {
  return (
    <div className="rounded-2xl border border-brand-line bg-brand-card/80 p-4 shadow-card backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
      </div>
      {big && <div className="mt-2 text-3xl font-bold text-white">{big}</div>}
      <div className="mt-2 space-y-1 text-xs text-neutral-400">
        {lines?.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <span>{k}</span>
            <span className="truncate text-neutral-300">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
