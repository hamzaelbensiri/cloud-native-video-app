import React from 'react';
import { Link } from 'react-router-dom';
import type { Video } from '@/types/api';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Eye } from 'lucide-react';

type Props = {
  video: Video;
  onDelete?: (id: number) => void;
};

export default function VideoManageCard({ video, onDelete }: Props) {
  const toWatch = `/watch/${video.video_id}`;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      className="group relative overflow-hidden rounded-2xl border border-brand-line bg-brand-card shadow-card"
    >
      {/* Media (click to watch) */}
      <Link to={toWatch} aria-label={`Watch ${video.title}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden">
          {video.blob_uri ? (
            <video
              className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
              src={video.blob_uri}
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
          {/* Hover 'Preview' badge */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-between p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur">
              <Eye size={14} className="text-brand-red" /> Preview
            </span>
          </div>
        </div>
      </Link>

      {/* Meta + actions */}
      <div className="flex items-start justify-between gap-3 p-3">
        <div className="min-w-0">
          <Link to={toWatch} className="block focus:outline-none focus:ring-2 focus:ring-brand-red/60 rounded">
            <h3 className="line-clamp-2 text-[15px] font-semibold tracking-wide text-white hover:underline">
              {video.title}
            </h3>
          </Link>
          <p className="mt-1 line-clamp-1 text-xs text-neutral-400">
            {(video.genre || 'Uncategorized')} • {new Date(video.upload_date).toLocaleDateString()}
          </p>
        </div>
        <div className="shrink-0 space-x-1">
          <Link
            to={`/my-videos/${video.video_id}/edit`}
            className="inline-flex items-center gap-1 rounded-xl border border-brand-line bg-black/30 px-2 py-1 text-xs text-neutral-200 hover:bg-white/5"
            title="Edit"
          >
            <Pencil size={14} /> Edit
          </Link>
          <button
            onClick={() => onDelete?.(video.video_id)}
            className="inline-flex items-center gap-1 rounded-xl border border-brand-line bg-black/30 px-2 py-1 text-xs text-red-300 hover:bg-white/5"
            title="Delete"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
}
