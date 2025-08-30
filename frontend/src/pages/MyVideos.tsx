import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchVideos, deleteVideo } from '@/api/videos';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import VideoManageCard from '@/components/VideoManageCard';
import { VideoCardSkeleton } from '@/components/Skeleton';
import Spinner from '@/components/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const PAGE = 60; // load a good chunk; we filter client-side by owner

export default function MyVideos() {
  const { user } = useAuth();
  const myId = user?.user_id ?? -1;
  const qc = useQueryClient();
  const { notify } = useToast();

  const [q, setQ] = useState('');

  // Pull a page or two and filter; if you have a dedicated "my videos" API, swap here
  const vidsQ = useQuery({
    queryKey: ['my-videos'],
    queryFn: () => fetchVideos(0, PAGE),
  });

  const myVideos = useMemo(() => {
    const list = (vidsQ.data ?? []).filter(v => v.creator_id === myId);
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(v =>
      [v.title, v.genre, v.publisher, v.producer]
        .filter(Boolean)
        .some(x => (String(x)).toLowerCase().includes(term))
    );
  }, [vidsQ.data, myId, q]);

  const delMut = useMutation({
    mutationFn: (id: number) => deleteVideo(id),
    onSuccess: () => {
      notify('Video deleted', 'success');
      qc.invalidateQueries({ queryKey: ['my-videos'] });
      qc.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.detail || 'Failed to delete video';
      notify(msg, 'error');
    }
  });

  const onDelete = (id: number) => {
    const target = vidsQ.data?.find(v => v.video_id === id);
    if (!target) return;
    if (confirm(`Delete "${target.title}"? This cannot be undone.`)) {
      delMut.mutate(id);
    }
  };

  return (
    <div className="bg-radial-vignette">
      <header className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="display text-3xl sm:text-4xl text-white">My Videos</h1>
            <p className="mt-1 text-sm text-neutral-400">Manage your uploads — edit titles, metadata, or remove videos.</p>
          </div>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-full bg-brand-red px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-redHover transition"
          >
            <PlusCircle size={14} /> Upload new
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-4">
        {/* Search */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex w-full items-center gap-2 rounded-2xl border border-brand-line bg-black/40 px-3 py-2">
            <Search size={16} className="text-neutral-500" />
            <input
              className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none"
              placeholder="Search your videos by title, genre, publisher, producer…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        {vidsQ.status === 'pending' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => <VideoCardSkeleton key={i} />)}
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myVideos.map(v => (
                  <motion.div
                    key={v.video_id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <VideoManageCard video={v} onDelete={onDelete} />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            {vidsQ.status === 'success' && myVideos.length === 0 && (
              <div className="mt-8 rounded-2xl border border-brand-line bg-black/30 p-6 text-center">
                <p className="text-sm text-neutral-400">No videos found in your library.</p>
                <Link
                  to="/upload"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-red px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-redHover transition"
                >
                  <PlusCircle size={14} /> Upload your first video
                </Link>
              </div>
            )}

            {delMut.isPending && (
              <div className="mt-4 flex justify-center">
                <Spinner label="Deleting…" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
