import { SudokuProvider, useSudoku } from "./provider";
import { Board } from "./Board";
import { Controls } from "./Controls";
import { Status } from "./Status";
import { Rules } from "./Rules";

function Inner() {
  const { hydrated } = useSudoku();
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

export default function Sudoku() {
  return (
    <SudokuProvider>
      <Inner />
    </SudokuProvider>
  );
}
