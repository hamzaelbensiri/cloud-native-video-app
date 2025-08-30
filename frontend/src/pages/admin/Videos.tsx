import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchVideos, deleteVideo } from '@/api/videos';
import type { Video } from '@/types/api';
import { useToast } from '@/components/Toast';
import Spinner from '@/components/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const PAGE = 120;

export default function AdminVideos() {
  const { notify } = useToast();
  const qc = useQueryClient();

  const [q, setQ] = useState('');
  const vidsQ = useQuery({ queryKey: ['admin-videos'], queryFn: () => fetchVideos(0, PAGE) });

  const filtered = useMemo(() => {
    const list = vidsQ.data ?? [];
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter(v =>
      [v.title, v.genre, v.publisher, v.producer].filter(Boolean)
        .some(x => String(x).toLowerCase().includes(t))
    );
  }, [vidsQ.data, q]);

  const delMut = useMutation({
    mutationFn: (id: number) => deleteVideo(id),
    onSuccess: () => {
      notify('Video deleted.', 'success');
      qc.invalidateQueries({ queryKey: ['admin-videos'] });
      qc.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (e: any) => notify(e?.response?.data?.detail || 'Failed to delete video', 'error')
  });

  return (
    <div className="bg-radial-vignette">
      <header className="mx-auto max-w-6xl px-4 pt-6">
        <h1 className="display text-3xl text-white">Admin · Videos</h1>
        <p className="mt-1 text-sm text-neutral-400">Moderate or remove videos.</p>
      </header>

      <div className="mx-auto max-w-6xl p-4">
        {/* Search */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex w-full items-center gap-2 rounded-2xl border border-brand-line bg-black/40 px-3 py-2">
            <Search size={16} className="text-neutral-500" />
            <input
              className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none"
              placeholder="Search videos by title, genre, publisher, producer…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        {vidsQ.status === 'pending' ? (
          <div className="flex items-center justify-center p-10">
            <Spinner label="Loading videos…" />
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(v => (
                  <motion.div
                    key={v.video_id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="group overflow-hidden rounded-2xl border border-brand-line bg-brand-card shadow-card"
                  >
                    <Link to={`/watch/${v.video_id}`} className="block">
                      <div className="relative aspect-video w-full overflow-hidden">
                        {v.blob_uri ? (
                          <video
                            className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                            src={v.blob_uri}
                            muted
                            preload="metadata"
                            playsInline
                            onMouseEnter={(e) => { try { (e.currentTarget as HTMLVideoElement).play(); } catch {} }}
                            onMouseLeave={(e) => (e.currentTarget as HTMLVideoElement).pause()}
                          />
                        ) : (
                          <div className="h-full w-full bg-neutral-900" />
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                        <div className="pointer-events-none absolute inset-0 flex items-end justify-between p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur">
                            <Eye size={14} className="text-brand-red" /> Preview
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-start justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-[15px] font-semibold tracking-wide text-white">{v.title}</h3>
                        <p className="mt-1 line-clamp-1 text-xs text-neutral-400">
                          {(v.genre || 'Uncategorized')} • Creator #{v.creator_id} • {new Date(v.upload_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${v.title}"? This cannot be undone.`)) delMut.mutate(v.video_id);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl border border-brand-line bg-black/30 px-2 py-1 text-xs text-red-300 hover:bg-white/5"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            {vidsQ.status === 'success' && filtered.length === 0 && (
              <div className="mt-8 rounded-2xl border border-brand-line bg-black/30 p-6 text-center">
                <p className="text-sm text-neutral-400">No videos found.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
