import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

// Flexoki accent palette — picked to look balanced on both light and dark
// backgrounds and to read as celebratory without veering into LinkedIn blue.
const COLORS = [
  "#d14d41", // red-400
  "#da702c", // orange-400
  "#d0a215", // yellow-400
  "#879a39", // green-400
  "#3aa99f", // cyan-400
  "#4385be", // blue-400
  "#8b7ec8", // purple-400
  "#ce5d97", // magenta-400
];

export function fireWinConfetti() {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const opts = { colors: COLORS, ticks: 200, scalar: 0.9 };
  // Two side bursts angled inward, plus a small overhead trickle.
  confetti({ ...opts, particleCount: 80, spread: 70, angle: 60, origin: { x: 0.15, y: 0.7 } });
  confetti({ ...opts, particleCount: 80, spread: 70, angle: 120, origin: { x: 0.85, y: 0.7 } });
  window.setTimeout(() => {
    confetti({ ...opts, particleCount: 60, spread: 100, startVelocity: 35, origin: { y: 0.4 } });
  }, 220);
}

// Fires once per win. Resets if the game un-solves (Clear / new puzzle), so
// the next solve plays again.
export function useWinConfetti(solved: boolean): void {
  const fired = useRef(false);
  useEffect(() => {
    if (solved && !fired.current) {
      fired.current = true;
      fireWinConfetti();
    } else if (!solved) {
      fired.current = false;
    }
  }, [solved]);
}
