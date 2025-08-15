import Card from "./card";
import { useSolitaire } from "./provider";

export default function Tableau() {
  const { gameState } = useSolitaire();
  const tableaus = gameState.tableaus;
  return (
    <div className="grid grid-cols-7 col-span-7 gap-4 pointer-events-none">
      {tableaus.map((tableau) => (
        <div className="col-span-1">
          {tableau.map((card) => (
            <Card card={card} className="-mt-16 first:mt-0" />
          ))}
        </div>
      ))}
    </div>
  );
}
