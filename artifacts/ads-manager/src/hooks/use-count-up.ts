import { useEffect, useRef, useState } from "react";

/**
 * Animate a number from 0 to `target` once per value change using an
 * ease-out cubic curve. Returns the current interpolated value; the caller
 * formats it (currency, number, ROAS, etc.).
 */
export function useCountUp(target: number, duration = 1100): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    let raf = 0;
    const from = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min(1, (ts - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
