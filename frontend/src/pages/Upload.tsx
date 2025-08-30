import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadVideo } from '@/api/videos';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { setMyRole } from '@/api/users';
import { getHttpErrorMessage } from '@/lib/httpError';
import { motion } from 'framer-motion';
import { UploadCloud, BadgePlus, Film, Info } from 'lucide-react';

const MAX_BYTES = 90 * 1024 * 1024; // keep under typical App Service limit
const ALLOWED = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

export default function Upload() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [publisher, setPublisher] = useState('');
  const [producer, setProducer] = useState('');
  const [genre, setGenre] = useState('');
  const [ageRating, setAgeRating] = useState('');
  const [pct, setPct] = useState(0);
  const { notify } = useToast();
  const nav = useNavigate();
  const { role, hydrateUser } = useAuth();

  const mut = useMutation({
    mutationFn: () =>
      uploadVideo(
        { title, file: file as File, publisher, producer, genre, age_rating: ageRating },
        (p) => setPct(p)
      ),
    onSuccess: (v) => {
      notify('Upload complete!', 'success');
      nav(`/watch/${v.video_id}`);
    },
    onError: (err: any) => {
      const status = err?.response?.status ? ` (HTTP ${err.response.status})` : '';
      notify(`${getHttpErrorMessage(err)}${status}`, 'error');
      setPct(0);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) {
      notify('Title and video file are required.', 'error');
      return;
    }
    if (!ALLOWED.has(file.type)) {
      notify(`Unsupported file type: ${file.type || 'unknown'}. Use mp4/webm/mov.`, 'error');
      return;
    }
    if (file.size > MAX_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      notify(`File too large (${mb} MB). Choose a video under 90 MB.`, 'error');
      return;
    }
    if (role !== 'creator' && role !== 'admin') {
      notify('You must be a creator to upload.', 'error');
      return;
    }
    mut.mutate();
  };

  const becomeCreator = async () => {
    try {
      await setMyRole('creator');
      await hydrateUser();
      notify('You are now a creator. You can upload videos.', 'success');
    } catch (err: any) {
      notify(getHttpErrorMessage(err) || 'Could not set role.', 'error');
    }
  };

  const notCreator = role !== 'creator' && role !== 'admin';

  return (
    <div className="bg-radial-vignette">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-brand-line bg-brand-card/80 p-6 shadow-card backdrop-blur"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="display text-3xl text-white">Upload</h1>
              <p className="mt-1 text-sm text-neutral-400">
                Share your latest creation with the world.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Info size={14} /> Max ~90MB • mp4, webm, mov
            </div>
          </div>

          {notCreator && (
            <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-950/30 p-3 text-sm text-amber-200">
              <p className="mb-2">
                Your current role is <b className="text-white">{role ?? 'unknown'}</b>. Only{' '}
                <b className="text-white">creator</b> or <b className="text-white">admin</b> can upload.
              </p>
              <Button onClick={becomeCreator}>
                <span className="inline-flex items-center gap-2">
                  <BadgePlus size={16} /> Become Creator
                </span>
              </Button>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label htmlFor="title" className="mb-1 block text-xs text-neutral-400">Title *</label>
              <input
                id="title"
                className="w-full rounded-2xl border border-brand-line bg-black/40 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-brand-red/60"
                placeholder="A cinematic title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="file" className="mb-1 block text-xs text-neutral-400">Video File *</label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-brand-line bg-black/30 px-4 py-4 text-sm text-neutral-300 hover:bg-black/40">
                <div className="flex items-center gap-2">
                  <UploadCloud size={18} className="text-brand-red" />
                  <span>{file ? file.name : 'Choose a file (mp4, webm, mov)'}</span>
                </div>
                <input
                  id="file"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                  required
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Publisher" value={publisher} onChange={setPublisher} placeholder="Studio / Channel" />
              <Field label="Producer" value={producer} onChange={setProducer} placeholder="Producer name" />
              <Field label="Genre" value={genre} onChange={setGenre} placeholder="e.g., Drama, Action" />
              <Field label="Age rating" value={ageRating} onChange={setAgeRating} placeholder="PG, 12, 15, 18" />
            </div>

            {mut.isPending && (
              <div aria-label="Upload progress" className="w-full rounded-2xl border border-brand-line bg-black/30 p-3">
                <div className="mb-1 flex justify-between text-xs text-neutral-400">
                  <span className="inline-flex items-center gap-2"><Film size={14}/> Uploading…</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 w-full rounded bg-neutral-800">
                  <div className="h-2 rounded bg-brand-red transition-[width]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            <Button type="submit" isLoading={mut.isPending} className="w-full" disabled={notCreator}>
              <span className="inline-flex items-center gap-2">
                <UploadCloud size={16} /> {mut.isPending ? 'Uploading…' : 'Upload'}
              </span>
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">{label}</label>
      <input
        className="w-full rounded-2xl border border-brand-line bg-black/40 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-brand-red/60"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
