import { useSudoku } from "./provider";
import { formatDuration, useElapsedSeconds } from "../../_shared/timer";
import type { Difficulty, Mode } from "../../_shared/types";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export function Controls() {
  const {
    active,
    mode,
    difficulty,
    setMode,
    setDifficulty,
    newRandom,
    clear,
    hint,
  } = useSudoku();
  const startedAt = active?.startedAt ?? null;
  const solved = active?.solvedAt != null;
  const elapsed = useElapsedSeconds(
    startedAt,
    !!active && active.solvedAt == null,
  );
  const finalElapsed =
    solved && active && active.solvedAt
      ? Math.floor((active.solvedAt - active.startedAt) / 1000)
      : elapsed;

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedToggle<Mode>
          value={mode}
          options={[
            { value: "daily", label: "Daily" },
            { value: "random", label: "Random" },
          ]}
          onChange={setMode}
        />

        <div className="ml-auto flex items-center gap-2 text-sm text-flexoki-base-700 dark:text-flexoki-base-300 font-mono tabular-nums">
          <span>{formatDuration(finalElapsed)}</span>
          <span aria-hidden="true">·</span>
          <span>moves: {active?.moveCount ?? 0}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SegmentedToggle<Difficulty>
          value={difficulty}
          options={DIFFICULTIES.map((d) => ({
            value: d,
            label: d[0].toUpperCase() + d.slice(1),
          }))}
          onChange={(d) => {
            setDifficulty(d);
            setMode("random");
          }}
          disabled={mode === "daily"}
          hint={mode === "daily" ? "Difficulty applies to Random puzzles" : undefined}
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => hint()}
            disabled={!active || active.solvedAt != null}
            className="text-sm px-3 py-1 border border-flexoki-base-200 dark:border-flexoki-base-800 hover:bg-flexoki-base-100 dark:hover:bg-flexoki-base-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hint
          </button>
          <button
            type="button"
            onClick={() => clear()}
            className="text-sm px-3 py-1 border border-flexoki-base-200 dark:border-flexoki-base-800 hover:bg-flexoki-base-100 dark:hover:bg-flexoki-base-900 transition-colors"
          >
            Clear
          </button>
          {mode === "random" && (
            <button
              type="button"
              onClick={() => newRandom()}
              className="text-sm px-3 py-1 border border-flexoki-base-200 dark:border-flexoki-base-800 hover:bg-flexoki-base-100 dark:hover:bg-flexoki-base-900 transition-colors"
            >
              New puzzle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface SegmentedToggleProps<T extends string> {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
  hint?: string;
}

function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  disabled,
  hint,
}: SegmentedToggleProps<T>) {
  return (
    <div
      className="inline-flex border border-flexoki-base-200 dark:border-flexoki-base-800"
      title={hint}
      aria-disabled={disabled || undefined}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={
              "text-sm px-3 py-1 transition-colors " +
              (active
                ? "bg-flexoki-base-200 dark:bg-flexoki-base-800 text-flexoki-ink dark:text-flexoki-base-50"
                : "hover:bg-flexoki-base-100 dark:hover:bg-flexoki-base-900")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
