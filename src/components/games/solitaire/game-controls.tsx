import { useSolitaire, useGameStats } from "./provider";

export default function GameControls() {
  const { startNewGame, autoMove, undo, canAutoMove } = useSolitaire();

  const stats = useGameStats();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const btn =
    "px-3 py-1 border border-flexoki-base-200 dark:border-flexoki-base-800 text-sm font-mono text-flexoki-base-700 dark:text-flexoki-base-300 hover:text-flexoki-ink dark:hover:text-flexoki-base-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="col-span-7 space-y-4 min-h-[180px]">
      <div>
        <h1 className="font-serif font-bold text-flexoki-ink dark:text-flexoki-base-50 text-2xl">
          Solitario Klondike
        </h1>
        <div className="flex gap-6 text-sm text-flexoki-base-600 dark:text-flexoki-base-400 font-mono">
          <span>Puntos: {stats.score}</span>
          <span>Movimientos: {stats.moves}</span>
          <span>Tiempo: {formatTime(stats.time)}</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => startNewGame()}
          className={btn}
        >
          Nueva partida
        </button>

        <button
          onClick={undo}
          disabled={!stats.canUndo}
          className={btn}
        >
          Deshacer
        </button>

        <button
          onClick={autoMove}
          disabled={!canAutoMove}
          className={btn}
        >
          Jugada automática
        </button>
      </div>

      <div className="min-h-[60px]">
        {stats.won && (
          <div className="relative p-3 border border-flexoki-green-600 dark:border-flexoki-green-400 overflow-hidden">
            <div className="pattern-hatch text-flexoki-green-600/15 dark:text-flexoki-green-400/15 absolute inset-0 pointer-events-none" />
            <div className="relative text-flexoki-green-600 dark:text-flexoki-green-400">
              <strong>¡Enhorabuena!</strong> Ganaste con {stats.score} puntos en{" "}
              {stats.moves} movimientos.
            </div>
          </div>
        )}

        {stats.lost && (
          <div className="relative p-3 border border-flexoki-red-600 dark:border-flexoki-red-400 overflow-hidden">
            <div className="pattern-cross text-flexoki-red-600/15 dark:text-flexoki-red-400/15 absolute inset-0 pointer-events-none" />
            <div className="relative text-flexoki-red-600 dark:text-flexoki-red-400">
              <strong>Fin de la partida.</strong> No quedan movimientos.
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-flexoki-base-500 dark:text-flexoki-base-500 font-mono">
        Cartas en las bases: {stats.foundationProgress.total}/52
        <div className="flex gap-2 mt-1">
          <span>♠ {stats.foundationProgress.S}</span>
          <span>♥ {stats.foundationProgress.H}</span>
          <span>♦ {stats.foundationProgress.D}</span>
          <span>♣ {stats.foundationProgress.C}</span>
        </div>
      </div>
    </div>
  );
}
