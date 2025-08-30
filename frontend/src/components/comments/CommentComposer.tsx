import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export default function CommentComposer({
  onSubmit,
  disabled,
}: {
  onSubmit: (content: string) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || busy) return;
    setBusy(true);
    try {
      await onSubmit(content);
      setText('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-brand-line bg-black/30 p-3">
      <label className="mb-2 block text-xs text-neutral-400">Add a comment</label>
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your thoughts…"
          rows={2}
          className="min-h-[40px] w-full resize-y rounded-xl border border-brand-line/60 bg-black/30 p-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-brand-red/60"
        />
        <Button disabled={disabled || busy || text.trim().length === 0} isLoading={busy} type="submit">
          <span className="inline-flex items-center gap-2">
            <Send size={14} /> Post
          </span>
        </Button>
      </div>
    </form>
  );
}
