import Tableau from "./Tableau";
import StockWaste from "./stock-waste";
import Foundations from "./foundations";

export default function GameBoard() {
  return (
    <div className="relative col-span-7 p-4 border border-flexoki-base-200 dark:border-flexoki-base-800 bg-flexoki-green-600/90 dark:bg-flexoki-green-600/30 grid grid-cols-7 gap-4 min-h-[600px] md:min-h-[700px] lg:min-h-[800px]">
      <StockWaste />
      <Foundations />
      <Tableau />
    </div>
  );
}
