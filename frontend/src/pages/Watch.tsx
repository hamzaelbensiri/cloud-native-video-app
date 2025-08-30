import React from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchVideo } from '@/api/videos';
import { listComments, addComment, updateComment, deleteComment } from '@/api/comments';
import { getRatingSummary, rateVideo } from '@/api/ratings';

import VideoPlayer from '@/components/VideoPlayer';
import RatingStars from '@/components/RatingStars';
import CommentComposer from '@/components/comments/CommentComposer';
import CommentList from '@/components/comments/CommentList';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const videoId = Number(id);
  const qc = useQueryClient();
  const { notify } = useToast();
  const { user, role, isAuthenticated } = useAuth();

  // ----- Video -----
  const videoQ = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => fetchVideo(videoId),
    enabled: Number.isFinite(videoId),
  });

  // ----- Comments -----
  const commentsQ = useQuery({
    queryKey: ['comments', videoId],
    queryFn: () => listComments(videoId),
    enabled: Number.isFinite(videoId),
  });

  const addMut = useMutation({
    mutationFn: (text: string) => addComment(videoId, text),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', videoId] }),
    onError: (err: any) =>
      notify(err?.response?.data?.detail || 'Failed to post comment', 'error'),
  });

  const editMut = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      updateComment(videoId, id, text),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', videoId] }),
    onError: (err: any) =>
      notify(err?.response?.data?.detail || 'Failed to update comment', 'error'),
  });

  const delMut = useMutation({
    mutationFn: (cid: number) => deleteComment(videoId, cid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', videoId] }),
    onError: (err: any) =>
      notify(err?.response?.data?.detail || 'Failed to delete comment', 'error'),
  });

  // ----- Ratings -----
  const ratingQ = useQuery({
    queryKey: ['rating-summary', videoId],
    queryFn: () => getRatingSummary(videoId),
    enabled: Number.isFinite(videoId),
  });

  const rateMut = useMutation({
    mutationFn: (n: number) => rateVideo(videoId, n),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rating-summary', videoId] });
      notify('Thanks for rating!', 'success');
    },
    onError: (err: any) =>
      notify(err?.response?.data?.detail || 'Could not submit rating', 'error'),
  });

  // ----- Loading / Error states -----
  if (videoQ.status === 'pending') {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="mt-4 h-6 w-2/3" />
        <Skeleton className="mt-2 h-4 w-1/3" />
      </div>
    );
  }

  if (videoQ.status === 'error' || !videoQ.data) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <div className="rounded-2xl border border-brand-line bg-red-950/30 p-4 text-sm text-red-200">
          Could not load the video. It may have been removed.
        </div>
      </div>
    );
  }

  const v = videoQ.data;

  return (
    <div className="bg-radial-vignette">
      <div className="mx-auto max-w-5xl p-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-brand-line bg-brand-card/80 p-3 shadow-card backdrop-blur"
        >
          <VideoPlayer src={v.blob_uri ?? ''} className="w-full" />

          <div className="mt-3 px-1">
            <h1 className="display text-2xl text-white">{v.title}</h1>
            <p className="mt-1 text-xs text-neutral-400">
              {(v.genre || 'Uncategorized')} • {new Date(v.upload_date).toLocaleString()}
            </p>
            <div className="mt-1 text-xs text-neutral-400">
              {v.publisher ? (
                <>
                  Publisher: <span className="text-neutral-300">{v.publisher}</span>
                </>
              ) : null}
              {v.producer ? (
                <>
                  {' '}
                  · Producer: <span className="text-neutral-300">{v.producer}</span>
                </>
              ) : null}
              {v.age_rating ? (
                <>
                  {' '}
                  · Age: <span className="text-neutral-300">{v.age_rating}</span>
                </>
              ) : null}
            </div>

            {/* Ratings */}
            <div className="mt-3">
              <RatingStars
                average={ratingQ.data?.average}
                count={ratingQ.data?.count}
                value={0}
                onRate={(n) => {
                  if (!isAuthenticated) {
                    // NOTE: notify only supports "success" | "error"
                    notify('Please sign in to rate this video.', 'error');
                    return;
                  }
                  rateMut.mutate(n);
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Comments */}
        <div className="mt-5">
          <CommentComposer
            onSubmit={async (text) => {
              await addMut.mutateAsync(text);
            }}
            disabled={addMut.isPending}
          />

          <div className="mt-4">
            {commentsQ.status === 'pending' ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            ) : (
              <CommentList
                comments={commentsQ.data ?? []}
                currentUserId={user?.user_id}
                isAdmin={role === 'admin'}
                onEdit={async (id, text) => {
                  await editMut.mutateAsync({ id, text });
                }}
                onDelete={async (id) => {
                  await delMut.mutateAsync(id);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
