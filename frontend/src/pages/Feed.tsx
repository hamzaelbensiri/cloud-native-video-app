import React, { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchVideos } from '@/api/videos';
import VideoCard from '@/components/VideoCard';
import { VideoCardSkeleton } from '@/components/Skeleton';
import Spinner from '@/components/Spinner';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';

const PAGE = 12;

export default function Feed() {
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('');

  const query = useInfiniteQuery({
    queryKey: ['videos'],
    queryFn: ({ pageParam = 0 }) => fetchVideos(pageParam, PAGE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE) return undefined;
      return allPages.flat().length; // next skip
    },
  });

  const flat = useMemo(() => (query.data?.pages ?? []).flat(), [query.data?.pages]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return flat.filter((v) => {
      const matchesText =
        !term ||
        [v.title, v.publisher, v.producer, v.genre]
          .filter(Boolean)
          .some((x) => (x as string).toLowerCase().includes(term));
      const matchesGenre = !genre || (v.genre || '').toLowerCase() === genre.toLowerCase();
      return matchesText && matchesGenre;
    });
  }, [flat, q, genre]);

  const canLoadMore = !!query.hasNextPage && !query.isFetchingNextPage;
  const sentinelRef = useInfiniteScroll(() => query.fetchNextPage(), canLoadMore);

  return (
    <div className="bg-radial-vignette">
      <header className="mx-auto max-w-7xl px-4 pt-6">
        <h1 className="display text-3xl sm:text-4xl md:text-5xl text-white">Tonight’s Picks</h1>
        <p className="mt-1 text-sm text-neutral-400">Fresh uploads and all-time favorites.</p>
      </header>

      <div className="mx-auto max-w-7xl p-4">
        {/* Search & Filter */}
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr,220px]">
          <label className="sr-only" htmlFor="search">Search</label>
          <div className="flex items-center gap-2 rounded-2xl border border-brand-line bg-black/40 px-3 py-2">
            <Search size={16} className="text-neutral-500" />
            <input
              id="search"
              className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none"
              placeholder="Search by title, publisher, producer, genre…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <label className="sr-only" htmlFor="genre">Genre</label>
          <div className="flex items-center gap-2 rounded-2xl border border-brand-line bg-black/40 px-3 py-2 sm:justify-self-end sm:w-56">
            <SlidersHorizontal size={16} className="text-neutral-500" />
            <input
              id="genre"
              className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none"
              placeholder="Filter by genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        {query.status === 'pending' ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((v) => (
                  <motion.div
                    key={v.video_id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <VideoCard video={v} />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            {filtered.length === 0 && (
              <p className="mt-6 text-sm text-neutral-400">No videos match your search.</p>
            )}

            {/* Auto load sentinel + spinner */}
            <div ref={sentinelRef} className="h-8 w-full" />
            {query.isFetchingNextPage && (
              <div className="mt-4 flex justify-center">
                <Spinner label="Loading more…" />
              </div>
            )}
            {!query.hasNextPage && flat.length > 0 && (
              <p className="mt-6 text-center text-sm text-neutral-500">You’re all caught up.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
