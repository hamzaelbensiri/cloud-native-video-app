import React from 'react';
export default function Spinner({ size = 'md', label }: { size?: 'sm'|'md'|'lg'; label?: string }) {
  const cls = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';
  return (
    <div className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <svg className={`${cls} animate-spin text-white`} viewBox="0 0 24 24">
        <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4A4 4 0 0 0 8 12H4z" />
      </svg>
      {label && <span className="text-sm text-neutral-300">{label}</span>}
    </div>
  );
}
