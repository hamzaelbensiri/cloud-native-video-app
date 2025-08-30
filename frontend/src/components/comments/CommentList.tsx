import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import type { Comment } from '@/types/api';

type Props = {
  comments: Comment[];
  currentUserId?: number | null;
  isAdmin?: boolean;
  onEdit?: (commentId: number, text: string) => Promise<void> | void;
  onDelete?: (commentId: number) => Promise<void> | void;
};

export default function CommentList({
  comments,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
}: Props) {
  if (!comments?.length) {
    return (
      <div className="rounded-2xl border border-brand-line bg-black/30 p-4 text-center text-sm text-neutral-400">
        No comments yet. Be the first to share your thoughts.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {comments.map((c) => (
          <CommentRow
            key={c.comment_id}
            c={c}
            canEdit={Boolean(isAdmin) || (currentUserId != null && currentUserId === c.user_id)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function CommentRow({
  c,
  canEdit,
  onEdit,
  onDelete,
}: {
  c: Comment;
  canEdit: boolean;
  onEdit?: (id: number, text: string) => Promise<void> | void;
  onDelete?: (id: number) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.comment_text || '');

  const save = async () => {
    const t = text.trim();
    if (!t) return;
    await onEdit?.(c.comment_id, t);
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
      className="rounded-2xl border border-brand-line bg-black/30 p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-neutral-400">
            User #{c.user_id}{' '}
            <span className="ml-2 text-neutral-500">
              {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
            </span>
          </div>

          {editing ? (
            <div className="mt-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                className="w-full resize-y rounded-xl border border-brand-line/60 bg-black/30 p-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-brand-red/60"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={save}
                  className="inline-flex items-center gap-1 rounded-xl border border-brand-line bg-black/30 px-2 py-1 text-xs text-neutral-200 hover:bg-white/5"
                >
                  <Check size={14} /> Save
                </button>
                <button
                  onClick={() => {
                    setText(c.comment_text || '');
                    setEditing(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-brand-line bg-black/30 px-2 py-1 text-xs text-neutral-300 hover:bg-white/5"
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-100">
              {c.comment_text}
            </p>
          )}
        </div>

        {canEdit && (
          <div className="shrink-0 space-x-1">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 rounded-xl border border-brand-line bg-black/30 px-2 py-1 text-xs text-neutral-200 hover:bg-white/5"
                title="Edit"
              >
                <Pencil size={14} /> Edit
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Delete this comment?')) onDelete?.(c.comment_id);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-brand-line bg-black/30 px-2 py-1 text-xs text-red-300 hover:bg-white/5"
              title="Delete"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
