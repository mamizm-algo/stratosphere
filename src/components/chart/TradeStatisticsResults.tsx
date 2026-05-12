import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Clock, Hourglass, MessageCircleQuestion } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { SimilarPattern, TransactionBoxModel } from "./SimilarityResults";
import { useEffect, useState } from "react";
import { StatItem } from "@/pages/Results";

export interface TradeStats {
  tradesWon: number;
  tradesLost: number;
  winRate: number;
  avgProfit: number;
  totalProfit: number;
  totalTrades: number;
  avgDuration?: number;
  tradesTimedOut: number;
}

interface TradeStatisticsProps {
  registerTransactionChange: (fn: (v: TransactionBoxModel) => void) => void;
  outcomes?: SimilarPattern[];
}

export const TradeStatisticsResults = ({ registerTransactionChange,  outcomes }: TradeStatisticsProps) => {
  const [transactionParams, setTransactionParams] = useState<TransactionBoxModel | null>(null);
   useEffect(() => {
    registerTransactionChange(setTransactionParams);
  }, [registerTransactionChange]);

  const normalize = (price: number, min: number, max: number) => {
    return (price - min) / (max - min) + 100;
  }

  // Calculate statistics based on virtual transaction
  const calculateStats = (): TradeStats | null => {
    if (!transactionParams) {
      return null;
    }

    const trades = outcomes.map((outcome) => {
      const outcomeCandles = outcome.outcomeCandles;
      if (!outcomeCandles || outcomeCandles.length === 0) return null;

      const setupCandles = outcome.setupCandles;
      const entryPrice = outcomeCandles[0].open;
      const isLong = transactionParams.position === "long";

       // convert from relative values to absolute for detail transaction view

      const setupMin = Math.min(...setupCandles.map(candle => candle.low));
      const setupMax = Math.max(...setupCandles.map(candle => candle.high));

      const lastIndex = setupCandles.length - 1;
      const setupOffset = 100 - normalize(setupCandles[lastIndex].close, setupMin, setupMax);

       // calculate profit size
      const normalizedProfitPrice = transactionParams.entryPrice + transactionParams.profitSize;
      const offsetProfitPrice = normalizedProfitPrice - setupOffset;
      const takeProfitPrice = (offsetProfitPrice - 100) * (setupMax - setupMin) + setupMin;
      const profitSize = (Math.abs(takeProfitPrice - entryPrice)) / entryPrice * 100;

      // calculate loss size
      const normalizedLossPrice = transactionParams.entryPrice + transactionParams.lossSize;
      const offsetLossPrice = normalizedLossPrice - setupOffset;
      const stopLossPrice = (offsetLossPrice - 100) * (setupMax - setupMin) + setupMin;
      const lossSize = (Math.abs(stopLossPrice - entryPrice)) / entryPrice * 100;

      const transactionDuration = Math.max(1, (transactionParams.endTime as number) - (transactionParams.startTime as number));
      let result: "win" | "loss" | "timeout" = "timeout";
      let profit = 0;
      let duration = transactionDuration;

      for (let i = 0; i < Math.min(outcomeCandles.length, transactionDuration); i++) {
        const candle = outcomeCandles[i];
        if (isLong) {
          if (candle.high >= takeProfitPrice) {
            result = "win";
            profit = profitSize;
            duration = i + 1;
            break;
          } else if (candle.low <= stopLossPrice) {
            result = "loss";
            profit = -lossSize;
            duration = i + 1;
            break;
          }
        } else {
          if (candle.low   <= takeProfitPrice) {
            result = "win";
            profit = profitSize;
            duration = i + 1;
            break;
          } else if (candle.high >= stopLossPrice) {
            result = "loss";
            profit = -lossSize;
            duration = i + 1;
            break;
          }
        }
      }

      if (result === "timeout") {
        const lastCandle = outcomeCandles[Math.min(outcomeCandles.length - 1, transactionDuration - 1)];
        profit = isLong 
          ? ((lastCandle.close - entryPrice) / entryPrice) * 100
          : ((entryPrice - lastCandle.close) / entryPrice) * 100;
      }

      return { result, profit, duration };
    }).filter(t => t !== null);

    const wins = trades.filter(t => t!.result === "win").length;
    const tradesTimedOut = trades.filter(t => t!.result === "timeout").length;
    const avgProfit = trades.reduce((acc, t) => acc + t!.profit, 0) / trades.length;
    const avgDuration = trades.reduce((acc, t) => acc + t!.duration, 0) / trades.length;
    const totalProfit = trades.reduce((acc, t) => acc + t!.profit, 0);

    return {
      tradesWon: wins,
      tradesLost: trades.length - wins - tradesTimedOut,
      winRate: (wins / trades.length) * 100,
      avgProfit,
      totalProfit,
      totalTrades: trades.length,
      avgDuration,
      tradesTimedOut,
    };
  };

  if (!transactionParams){
    return;
  } else {
    const stats = calculateStats();
 
    return (
      <div className="space-y-4 mb-4">
        {/* General Statistics */}
        {stats && outcomes && (
         <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-3">
                         <Card className="p-3">
                           <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Transaction</h4>
                           <div className="grid grid-cols-2 gap-2 text-sm">
                             <div>
                               <p className="text-[10px] text-muted-foreground uppercase">Position</p>
                               <p className="font-semibold capitalize">{transactionParams.position}</p>
                             </div>
                             <div>
                               <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
                               <p className="font-semibold">{Math.max(1, (transactionParams.endTime as number) - (transactionParams.startTime as number))} bars</p>
                             </div>
                           </div>
                         </Card>
       
                         <Card className="p-3">
                           <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Performance</h4>
                           <div className="grid grid-cols-2 gap-2">
                             <StatItem 
                               icon={<Target className="w-3.5 h-3.5 text-primary" />}
                               label="Win Rate"
                               value={`${calculateStats().winRate.toFixed(1)}%`}
                             />
                             <StatItem 
                               icon={<TrendingUp className="w-3.5 h-3.5 text-primary" />}
                               label="Trades"
                               value={String(stats.totalTrades)}
                             />
                             <StatItem 
                               icon={stats.avgProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-bullish" /> : <TrendingDown className="w-3.5 h-3.5 text-bearish" />}
                               label="Avg Result"
                               value={`${stats.avgProfit >= 0 ? "+" : ""}${stats.avgProfit.toFixed(2)}%`}
                               valueClass={stats.avgProfit >= 0 ? "text-bullish" : "text-bearish"}
                             />
                             <StatItem 
                               icon={stats.totalProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-bullish" /> : <TrendingDown className="w-3.5 h-3.5 text-bearish" />}
                               label="Total P/L"
                               value={`${stats.totalProfit >= 0 ? "+" : ""}${stats.totalProfit.toFixed(2)}%`}
                               valueClass={stats.totalProfit >= 0 ? "text-bullish" : "text-bearish"}
                             />
                             <StatItem 
                               icon={<Clock className="w-3.5 h-3.5 text-primary" />}
                               label="Avg Duration"
                               value={`${stats.avgDuration?.toFixed(1) || 0}`}
                             />
                             <StatItem 
                               icon={<Hourglass className="w-3.5 h-3.5 text-muted-foreground" />}
                               label="Timeouts"
                               value={String(stats.tradesTimedOut)}
                             />
                           </div>
                         </Card>
       
                         <Card className="p-3">
                           <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tip</h4>
                           <p className="text-xs text-muted-foreground">
                             Draw a transaction box on the chart to test your strategy across all patterns.
                           </p>
                         </Card>
                       </div>
        )}
      </div>
    );
  }
};
