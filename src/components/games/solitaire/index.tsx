import GameBoard from "./game-board";
import GameControls from "./game-controls";
import Hint from "./hint";
import { SolitaireProvider } from "./provider";

export default function Solitaire() {
  return (
    <SolitaireProvider>
      <div className="min-h-[800px] md:min-h-[900px] lg:min-h-[1000px] flex flex-col">
        <div className="grid grid-cols-7 gap-4 flex-1">
          <GameControls />
          <GameBoard />
          <Hint />
        </div>
      </div>
    </SolitaireProvider>
  );
}
