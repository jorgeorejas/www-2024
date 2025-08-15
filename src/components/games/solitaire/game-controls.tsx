import { useSolitaire, useGameStats } from "./provider";

export default function GameControls() {
  const { startNewGame, autoMove, undo, canAutoMove } = useSolitaire();

  const stats = useGameStats();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="col-span-7 space-y-4 min-h-[180px]">
      <div>
        <h1 className="font-serif font-bold text-black text-2xl">
          Klondike Solitaire
        </h1>
        <div className="flex gap-6 text-sm text-zinc-600 font-mono">
          <span>Score: {stats.score}</span>
          <span>Moves: {stats.moves}</span>
          <span>Time: {formatTime(stats.time)}</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => startNewGame()}
          className="px-3 py-1 bg-zinc-600 text-white rounded text-sm hover:bg-zinc-700 transition-colors"
        >
          New Game
        </button>

        <button
          onClick={undo}
          disabled={!stats.canUndo}
          className="px-3 py-1 bg-zinc-600 text-white rounded text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Undo
        </button>

        <button
          onClick={autoMove}
          disabled={!canAutoMove}
          className="px-3 py-1 bg-zinc-600 text-white rounded text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Auto Move
        </button>
      </div>

      {/* Fixed height container for status messages to prevent layout shifts */}
      <div className="min-h-[60px]">
        {stats.won && (
          <div className="text-zinc-700 bg-zinc-50 p-3 rounded border border-zinc-200">
            <strong>Congratulations!</strong> You won with a score of{" "}
            {stats.score} in {stats.moves} moves!
          </div>
        )}

        {stats.lost && (
          <div className="text-zinc-700 bg-zinc-50 p-3 rounded border border-zinc-200">
            <strong>Game Over</strong> - No more moves available.
          </div>
        )}
      </div>

      <div className="text-xs text-zinc-500">
        Foundation Progress: {stats.foundationProgress.total}/52 cards
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
