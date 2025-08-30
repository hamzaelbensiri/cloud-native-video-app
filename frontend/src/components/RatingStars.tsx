import React, { useMemo, useState } from 'react';
import { Star } from 'lucide-react';

type Props = {
  value?: number;                  // user's current rating (1..5), optional
  average?: number;                // average rating for display
  count?: number;                  // number of ratings
  onRate?: (n: number) => void;    // called when user clicks a star
  size?: number;                   // icon size
  className?: string;
  readOnly?: boolean;
};

export default function RatingStars({
  value = 0,
  average,
  count,
  onRate,
  size = 18,
  className = '',
  readOnly = false,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;

  const meta = useMemo(() => {
    if (average == null || count == null) return null;
    return `${average.toFixed(1)} • ${count} rating${count === 1 ? '' : 's'}`;
  }, [average, count]);

  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const n = i + 1;
          const filled = active >= n;
          return (
            <button
              key={n}
              type="button"
              aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
              title={`Rate ${n}`}
              onMouseEnter={() => !readOnly && setHover(n)}
              onMouseLeave={() => !readOnly && setHover(null)}
              onClick={() => !readOnly && onRate?.(n)}
              className={`rounded p-0.5 transition ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-[1.03]'
              }`}
            >
              <Star
                size={size}
                className={filled ? 'fill-brand-red text-brand-red' : 'text-neutral-500'}
              />
            </button>
          );
        })}
        {meta && (
          <span className="ml-2 text-xs text-neutral-400">{meta}</span>
        )}
      </div>
    </div>
  );
}
