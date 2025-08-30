import React from 'react';
import { Link } from 'react-router-dom';
import type { Video } from '@/types/api';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

type Props = { video: Video };

export default function VideoCard({ video }: Props) {
  const toWatch = `/watch/${video.video_id}`;
  const hasSrc = Boolean(video.blob_uri);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      className="group relative overflow-hidden rounded-2xl border border-brand-line bg-brand-card shadow-card"
    >
      {/* Media (click to watch) */}
      <Link to={toWatch} aria-label={`Watch ${video.title}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden">
          {hasSrc ? (
            <video
              className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
              src={video.blob_uri ?? undefined}
              muted
              preload="metadata"
              playsInline
              onMouseEnter={(e) => {
                try { (e.currentTarget as HTMLVideoElement).play(); } catch {}
              }}
              onMouseLeave={(e) => (e.currentTarget as HTMLVideoElement).pause()}
            />
          ) : (
            <div className="h-full w-full bg-neutral-900" />
          )}

          {/* Gradient overlay for readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

          {/* Hover 'Preview' badge (same as My Videos) */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-start p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur">
              <Eye size={14} className="text-brand-red" /> Preview
            </span>
          </div>
        </div>
      </Link>

      {/* Meta */}
      <div className="p-3">
        <Link to={toWatch} className="block rounded focus:outline-none focus:ring-2 focus:ring-brand-red/60">
          <h3 className="line-clamp-2 text-[15px] font-semibold tracking-wide text-white hover:underline">
            {video.title}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-1 text-xs text-neutral-400">
          {(video.genre || 'Uncategorized')} • {new Date(video.upload_date).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}
