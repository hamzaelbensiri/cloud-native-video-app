import React from 'react';

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-neutral-600">This screen will be implemented in the next phase.</p>
    </div>
  );
}
