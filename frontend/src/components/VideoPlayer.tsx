import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize2, Eye } from 'lucide-react';
import './video.css';

type Props = {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
  /** Show the bottom-left "Preview" badge until first play */
  showPreviewBadge?: boolean;
};

/**
 * Cinematic player with:
 * - Stable height (aspect-video) to prevent layout shift before metadata loads
 * - Shimmer placeholder + optional "Preview" overlay until first play
 * - Center play button overlay when paused
 * - Bottom control bar (play/pause, mute, time, fullscreen) with auto-hide
 * - Hides native "big play" overlays for consistent look
 */
export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  className,
  showPreviewBadge = true,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [ready, setReady] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(Boolean(autoPlay));
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(false);
  const [showUi, setShowUi] = useState(true);
  const [pct, setPct] = useState(0);
  const [time, setTime] = useState({ cur: 0, dur: 0 });

  // show controls briefly on mouse/touch move
  useEffect(() => {
    let t: any;
    const onMove = () => {
      setShowUi(true);
      clearTimeout(t);
      t = setTimeout(() => setShowUi(false), 1600);
    };
    const el = videoRef.current;
    el?.addEventListener('mousemove', onMove);
    el?.addEventListener('touchstart', onMove, { passive: true } as any);
    return () => {
      el?.removeEventListener('mousemove', onMove);
      el?.removeEventListener('touchstart', onMove);
      clearTimeout(t);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current!;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
      setHasPlayed(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };
  const toggleMute = () => {
    const v = videoRef.current!;
    v.muted = !v.muted;
    setMuted(v.muted);
  };
  const onTimeUpdate = () => {
    const v = videoRef.current!;
    const cur = v.currentTime || 0;
    const dur = v.duration || 0;
    setTime({ cur, dur });
    setPct(dur ? (cur / dur) * 100 : 0);
  };
  const onScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current!;
    const val = Number(e.target.value);
    if (!Number.isFinite(val) || !v.duration) return;
    v.currentTime = (val / 100) * v.duration;
  };
  const goFull = async () => {
    const v = videoRef.current as any;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await v.requestFullscreen();
    } catch { /* ignore */ }
  };
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${m}:${ss.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border border-brand-line/60 bg-black/40 ${className || ''}`}>
      {/* --- Stable aspect ratio wrapper (prevents shrink/shift) --- */}
      <div className="relative aspect-video w-full">
        {/* Actual <video> fills the box */}
        <video
          ref={videoRef}
          className="vp-video absolute inset-0 h-full w-full rounded-[10px] bg-black object-contain"
          src={src}
          poster={poster}
          preload="metadata"
          playsInline
          autoPlay={autoPlay}
          onClick={togglePlay}
          onTimeUpdate={onTimeUpdate}
          onPlay={() => { setPlaying(true); setHasPlayed(true); }}
          onPause={() => setPlaying(false)}
          onLoadedData={() => setReady(true)}
        />

        {/* Placeholder shimmer until metadata is ready */}
        <AnimatePresence>
          {!ready && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-[10px] bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-neutral-950"
            >
              <div className="h-full w-full animate-pulse bg-[linear-gradient(110deg,rgba(255,255,255,0.06)_8%,rgba(255,255,255,0.02)_18%,rgba(255,255,255,0.06)_33%)] bg-[length:200%_100%]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top gradient for readability */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 via-black/10 to-transparent" />

        {/* Center overlay: use flex centering (perfectly centered on all screens) */}
        <AnimatePresence>
          {(!playing || !hasPlayed) && (
            <motion.button
              type="button"
              onClick={togglePlay}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-10 flex items-center justify-center"
              aria-label="Play"
            >
              <span className="rounded-full bg-black/50 p-4 ring-1 ring-white/10 backdrop-blur hover:bg-black/60">
                <Play size={28} className="text-white" />
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Optional "Preview" badge (visible until first play) */}
        <AnimatePresence>
          {showPreviewBadge && !hasPlayed && ready && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="pointer-events-none absolute left-3 bottom-3 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur"
            >
              <Eye size={14} className="text-brand-red" /> Preview
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls (auto-hide) */}
        <AnimatePresence>
          {showUi && ready && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-x-0 bottom-0 p-3"
            >
              <div className="rounded-xl border border-white/10 bg-black/50 p-2 backdrop-blur">
                <input
                  aria-label="Scrub"
                  type="range"
                  min={0}
                  max={100}
                  value={pct}
                  onChange={onScrub}
                  className="range range-xs w-full accent-brand-red"
                />
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-neutral-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="rounded-lg border border-white/10 bg-white/5 p-1.5 hover:bg-white/10"
                    >
                      {playing ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      onClick={toggleMute}
                      className="rounded-lg border border-white/10 bg-white/5 p-1.5 hover:bg-white/10"
                    >
                      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <span className="ml-1 tabular-nums">
                      {fmt(time.cur)} / {fmt(time.dur || 0)}
                    </span>
                  </div>
                  <button
                    onClick={goFull}
                    className="rounded-lg border border-white/10 bg-white/5 p-1.5 hover:bg-white/10"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
