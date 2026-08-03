import { useEffect, useRef, useState } from "react";

const REVEAL_INTERSECTION_THRESHOLD = 0.15;
const REVEAL_ROOT_MARGIN = "0px 0px -8% 0px";

/** Reveals an element once it scrolls into view; it never re-hides afterward. */
export function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(element);
        }
      },
      { threshold: REVEAL_INTERSECTION_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, isRevealed };
}
