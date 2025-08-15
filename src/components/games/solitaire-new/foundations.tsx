import Card from "./card";
import { useSolitaire } from "./provider";

export default function Foundations() {
  const { gameState } = useSolitaire();
  return (
    <div className="col-span-4 col-start-4 pointer-events-none space-y-2">
      <div className="text-xs text-zinc-50 text-center font-medium font-mono select-none">
        Foundations
      </div>
      <div className="grid grid-cols-4 gap-4">
        {gameState.foundations.H.length === 0 ? (
          <Card.EmptyStack suit="H" />
        ) : (
          <Card
            card={gameState.foundations.H[gameState.foundations.H.length - 1]}
          />
        )}
        {gameState.foundations.C.length === 0 ? (
          <Card.EmptyStack suit="C" />
        ) : (
          <Card
            card={gameState.foundations.C[gameState.foundations.C.length - 1]}
          />
        )}
        {gameState.foundations.D.length === 0 ? (
          <Card.EmptyStack suit="D" />
        ) : (
          <Card
            card={gameState.foundations.D[gameState.foundations.D.length - 1]}
          />
        )}
        {gameState.foundations.S.length === 0 ? (
          <Card.EmptyStack suit="S" />
        ) : (
          <Card
            card={gameState.foundations.S[gameState.foundations.S.length - 1]}
          />
        )}
      </div>
    </div>
  );
}
