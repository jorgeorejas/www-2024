import Tableau from "./tableau";
import StockWaste from "./stock-waste";
import Foundations from "./foundations";

export default function GameBoard() {
  return (
    <div className="col-span-7 p-4 rounded-sm bg-green-800/90 grid grid-cols-7 gap-4">
      <StockWaste />
      <Foundations />
      <Tableau />
    </div>
  );
}
