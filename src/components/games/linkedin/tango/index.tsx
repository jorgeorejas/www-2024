import { TangoProvider, useTango } from "./provider";
import { Board } from "./Board";
import { Controls } from "./Controls";
import { Status } from "./Status";
import { Rules } from "./Rules";
import { useWinConfetti } from "../../_shared/confetti";
import { useRecordSolveOnWin } from "../../_shared/history";

function Inner() {
  const { hydrated, active } = useTango();
  useWinConfetti(active?.solvedAt != null);
  useRecordSolveOnWin("tango", active);
  if (!hydrated) {
    return (
      <div className="text-sm text-flexoki-base-500 dark:text-flexoki-base-500 font-serif text-center py-12">
        Generating puzzle…
      </div>
    );
  }
  return (
    <div>
      <Controls />
      <Board />
      <Status />
      <Rules />
    </div>
  );
}

export default function Tango() {
  return (
    <TangoProvider>
      <Inner />
    </TangoProvider>
  );
}
