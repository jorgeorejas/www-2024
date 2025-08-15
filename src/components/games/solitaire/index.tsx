import GameBoard from "./game-board";
import GameControls from "./game-controls";
import Hint from "./hint";
import { SolitaireProvider } from "./provider";

export default function Solitaire() {
  return (
    <SolitaireProvider>
      <div className="grid grid-cols-7 gap-4">
        <GameControls />
        <GameBoard />
        <Hint />
      </div>
    </SolitaireProvider>
  );
}
