import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchVideo, updateVideo, deleteVideo } from '@/api/videos';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { getHttpErrorMessage } from '@/lib/httpError';
import { Skeleton } from '@/components/Skeleton';
import VideoPlayer from '@/components/VideoPlayer';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Trash2, Info, Film } from 'lucide-react';

type Editable = {
  title: string;
  publisher?: string;
  producer?: string;
  genre?: string;
  age_rating?: string;
};

export default function EditVideo() {
  const { id } = useParams<{ id: string }>();
  const videoId = Number(id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const { notify } = useToast();

  // 1) Load video
  const videoQ = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => fetchVideo(videoId),
  });

  // 2) Form state (initialized from video once)
  const [form, setForm] = useState<Editable>({
    title: '',
    publisher: '',
    producer: '',
    genre: '',
    age_rating: '',
  });

  useEffect(() => {
    if (videoQ.data) {
      setForm({
        title: videoQ.data.title || '',
        publisher: videoQ.data.publisher || '',
        producer: videoQ.data.producer || '',
        genre: videoQ.data.genre || '',
        age_rating: videoQ.data.age_rating || '',
      });
    }
  }, [videoQ.data]);

  const changed = useMemo(() => {
    const v = videoQ.data;
    if (!v) return false;
    return (
      form.title !== (v.title || '') ||
      (form.publisher || '') !== (v.publisher || '') ||
      (form.producer || '') !== (v.producer || '') ||
      (form.genre || '') !== (v.genre || '') ||
      (form.age_rating || '') !== (v.age_rating || '')
    );
  }, [form, videoQ.data]);

  // 3) Mutations
  const saveMut = useMutation({
    mutationFn: () => updateVideo(videoId, form),
    onSuccess: async (v) => {
      notify('Changes saved.', 'success');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['video', videoId] }),
        qc.invalidateQueries({ queryKey: ['my-videos'] }),
        qc.invalidateQueries({ queryKey: ['videos'] }),
      ]);
      nav(`/watch/${v.video_id}`);
    },
    onError: (err: any) => notify(getHttpErrorMessage(err) || 'Failed to save changes', 'error'),
  });

  const delMut = useMutation({
    mutationFn: () => deleteVideo(videoId),
    onSuccess: async () => {
      notify('Video deleted.', 'success');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['my-videos'] }),
        qc.invalidateQueries({ queryKey: ['videos'] }),
      ]);
      nav('/my-videos');
    },
    onError: (err: any) => notify(getHttpErrorMessage(err) || 'Failed to delete video', 'error'),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      notify('Title is required.', 'error');
      return;
    }
    saveMut.mutate();
  };

  const confirmDelete = () => {
    if (!videoQ.data) return;
    if (confirm(`Delete "${videoQ.data.title}"? This cannot be undone.`)) {
      delMut.mutate();
    }
  };

  // ----- UI -----
  if (videoQ.status === 'pending') {
    return (
      <div className="mx-auto max-w-6xl p-4">
        <Skeleton className="h-10 w-40" />
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (videoQ.status === 'error' || !videoQ.data) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <div className="rounded-2xl border border-brand-line bg-red-950/30 p-4 text-sm text-red-200">
          Failed to load video. It may have been removed.
        </div>
      </div>
    );
  }

  const v = videoQ.data;

  return (
    <div className="bg-radial-vignette">
      <header className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/my-videos"
              className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-black/30 px-3 py-1.5 text-xs text-neutral-200 hover:bg-white/5"
            >
              <ArrowLeft size={16} /> Back to My Videos
            </Link>
            <div className="text-xs text-neutral-400 inline-flex items-center gap-2">
              <Film size={14} /> Video ID: {v.video_id}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={confirmDelete}
              disabled={delMut.isPending}
              className="inline-flex items-center gap-2"
            >
              <Trash2 size={16} /> {delMut.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {/* Left: Preview */}
          <div className="rounded-2xl border border-brand-line bg-brand-card/80 p-3 shadow-card backdrop-blur">
            <div className="rounded-xl border border-brand-line/60 bg-black/40 p-2">
              <VideoPlayer src={v.blob_uri} />
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Current video preview. Replacing the video file is not supported in this editor.
            </p>
          </div>

          {/* Right: Form */}
          <div className="rounded-2xl border border-brand-line bg-brand-card/80 p-4 shadow-card backdrop-blur">
            <h1 className="display text-3xl text-white">Edit Video</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Update title or metadata. Changes apply immediately after saving.
            </p>

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <Field
                label="Title *"
                value={form.title}
                onChange={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="A cinematic title…"
                required
              />
              <Field
                label="Publisher"
                value={form.publisher || ''}
                onChange={(v) => setForm((f) => ({ ...f, publisher: v }))}
                placeholder="Studio / Channel"
              />
              <Field
                label="Producer"
                value={form.producer || ''}
                onChange={(v) => setForm((f) => ({ ...f, producer: v }))}
                placeholder="Producer name"
              />
              <Field
                label="Genre"
                value={form.genre || ''}
                onChange={(v) => setForm((f) => ({ ...f, genre: v }))}
                placeholder="e.g., Drama, Action"
              />
              <Field
                label="Age rating"
                value={form.age_rating || ''}
                onChange={(v) => setForm((f) => ({ ...f, age_rating: v }))}
                placeholder="PG, 12, 15, 18"
              />

              <div className="rounded-2xl border border-brand-line bg-black/30 p-3 text-xs text-neutral-400">
                <div className="inline-flex items-center gap-2">
                  <Info size={14} />
                  Uploaded on {new Date(v.upload_date).toLocaleString()}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button
                  type="submit"
                  isLoading={saveMut.isPending}
                  disabled={!changed || saveMut.isPending}
                  className="inline-flex items-center gap-2"
                >
                  <Save size={16} /> {saveMut.isPending ? 'Saving…' : 'Save changes'}
                </Button>

                <Link
                  to={`/watch/${v.video_id}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-brand-line bg-black/30 px-3 py-2 text-xs text-neutral-200 hover:bg-white/5"
                >
                  Preview
                </Link>

                {!changed && (
                  <span className="text-xs text-neutral-500">No edits yet.</span>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* --- Small input component for consistent styling --- */
function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">{label}</label>
      <input
        className="w-full rounded-2xl border border-brand-line bg-black/40 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-brand-red/60"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
