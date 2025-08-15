import GameBoard from "./game-board";
import GameControls from "./game-controls";
import { SolitaireProvider } from "./provider";

export default function SolitaireNew() {
  return (
    <SolitaireProvider>
      <div className="grid grid-cols-7 gap-4">
        <GameControls />
        <GameBoard />
      </div>
    </SolitaireProvider>
  );
}
