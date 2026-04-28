import { useEffect, useRef, useState } from "react";

// Wall-clock timer driven by startedAt; pauses when `running` is false by
// freezing the displayed value (no timestamp drift on resume because the
// reducer is the source of truth for startedAt).
export function useElapsedSeconds(
  startedAt: number | null,
  running: boolean,
): number {
  const [elapsed, setElapsed] = useState(() =>
    startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0,
  );
  const lastFrame = useRef<number | null>(null);

  useEffect(() => {
    if (!running || startedAt == null) return;
    setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => {
      window.clearInterval(id);
      lastFrame.current = null;
    };
  }, [startedAt, running]);

  return elapsed;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
