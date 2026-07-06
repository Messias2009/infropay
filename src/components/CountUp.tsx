import { useEffect, useRef, useState } from "react";

type Props = {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
};

/** Number that animates from 0 to `to` when it becomes visible. */
export function CountUp({ to, duration = 1600, prefix = "", suffix = "", decimals = 0, className }: Props) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const step = (t: number) => {
            const p = Math.min(1, (t - t0) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(to * eased);
            if (p < 1) requestAnimationFrame(step);
            else setVal(to);
          };
          requestAnimationFrame(step);
        }
      }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  const formatted = val.toLocaleString("pt-PT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return <span ref={ref} className={className}>{prefix}{formatted}{suffix}</span>;
}
