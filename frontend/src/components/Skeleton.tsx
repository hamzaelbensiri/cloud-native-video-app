import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-neutral-800/60 ${className}`} />;
}

export function VideoCardSkeleton() {
  return (
    <div className="rounded-2xl border border-brand-line bg-brand-card p-0">
      <Skeleton className="aspect-video w-full rounded-t-2xl" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
