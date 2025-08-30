import { useEffect, useRef } from 'react';

export function useInfiniteScroll(callback: () => void, canLoad: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && canLoad) callback();
    }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.unobserve(el);
  }, [callback, canLoad]);

  return ref;
}
