import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Clock, Hourglass, MessageCircleQuestion } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { SimilarPattern, TransactionBoxModel } from "./SimilarityResults";
import { useEffect, useState } from "react";

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

export const TradeStatistics = ({ registerTransactionChange,  outcomes }: TradeStatisticsProps) => {
  const [transactionParams, setTransactionParams] = useState<TransactionBoxModel | null>(null);
   useEffect(() => {
      registerTransactionChange(setTransactionParams);
    }, [registerTransactionChange]);

  // Calculate statistics based on virtual transaction
  const calculateStats = (): TradeStats | null => {
    if (!transactionParams) {
      return null;
    }

    const outcomesData = outcomes.map((pattern) => {
      return pattern.outcomeCandles;
    });

    const trades = outcomesData.map((outcome) => {
      if (!outcome || outcome.length === 0) return null;

      const entryPrice = 100;
      const isLong = transactionParams.position === "long";
      const takeProfitPrice = entryPrice + transactionParams.profitSize;
      const stopLossPrice = entryPrice + transactionParams.lossSize;

      let result: "win" | "loss" | "timeout" = "timeout";
      let profit = 0;
      let duration = transactionParams.duration;

      for (let i = 0; i < Math.min(outcome.length, transactionParams.duration); i++) {
        const candle = outcome[i];
        if (isLong) {
          if (candle.high / outcome[0].open * 100 >= takeProfitPrice) {
            result = "win";
            profit = transactionParams.profitSize / 100;
            duration = i + 1;
            break;
          } else if (candle.low / outcome[0].open * 100 <= stopLossPrice) {
            result = "loss";
            profit = -transactionParams.lossSize / 100;
            duration = i + 1;
            break;
          }
        } else {
          if (candle.low / outcome[0].open * 100  <= takeProfitPrice) {
            result = "win";
            profit = -transactionParams.profitSize / 100;
            duration = i + 1;
            break;
          } else if (candle.high / outcome[0].open * 100 >= stopLossPrice) {
            result = "loss";
            profit = transactionParams.lossSize / 100;
            duration = i + 1;
            break;
          }
        }
      }

      if (result === "timeout") {
        const lastCandle = outcome[Math.min(outcome.length - 1, transactionParams.duration - 1)];
        profit = isLong 
          ? ((lastCandle.close / outcome[0].open * 100 - entryPrice) / entryPrice) * 100
          : ((entryPrice - lastCandle.close/ outcome[0].open * 100) / entryPrice) * 100;
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
      <div className="space-y-4">
        {/* General Statistics */}
        {stats && outcomes && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                Win Rate
              </span>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <MessageCircleQuestion className="w-4 h-4" />
                </TooltipTrigger>

                <TooltipContent >
                  <p>
                    {stats.totalTrades} trades opened
                  </p>
                  <p>
                    {stats.tradesWon} hit the Take Profit level
                  </p>
                  <p>
                    {stats.tradesLost} hit the Stop Loss
                  </p>
                  <p>
                    {stats.tradesTimedOut} timed out before hitting either level
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.winRate.toFixed(1)}%
            </p>
          </Card>


          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Trades</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalTrades}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {stats.avgProfit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-bullish" />
              ) : (
                <TrendingDown className="w-4 h-4 text-bearish" />
              )}
              <span className="text-xs text-muted-foreground">Avg Result</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                      <MessageCircleQuestion className="w-4 h-4" />
                  </TooltipTrigger>

                  <TooltipContent>
                    <p>
                      Average result including wins, losses and timeouts.
                    </p>
                  </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            </div>
            <p className={`text-2xl font-bold ${stats.avgProfit >= 0 ? "text-bullish" : "text-bearish"}`}>
              {stats.avgProfit >= 0 ? "+" : ""}
              {stats.avgProfit.toFixed(2)}%
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {stats.avgProfit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-bullish" />
              ) : (
                <TrendingDown className="w-4 h-4 text-bearish" />
              )}
              <span className="text-xs text-muted-foreground">Total profit</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                      <MessageCircleQuestion className="w-4 h-4" />
                  </TooltipTrigger>

                  <TooltipContent>
                    <p>
                      Total result made after executing all trades.
                    </p>
                  </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            </div>
            <p className={`text-2xl font-bold ${stats.avgProfit >= 0 ? "text-bullish" : "text-bearish"}`}>
              {stats.totalProfit >= 0 ? "+" : ""}
              {stats.totalProfit.toFixed(2)}%
            </p>
          </Card>

          {stats.avgDuration && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Avg Duration</span>
                <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                      <MessageCircleQuestion className="w-4 h-4" />
                  </TooltipTrigger>

                  <TooltipContent>
                    <p>
                      Average number of candles passed before closing the trade (because of hitting the Take Profit or Stop Loss level, or timing out)
                    </p>
                  </TooltipContent>
                </Tooltip>
            </TooltipProvider>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.avgDuration.toFixed(1)} candles</p>
            </Card>
          )}

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hourglass  className="w-4 h-4" />
              <span className="text-xs text-muted-foreground">Trades timed out</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                      <MessageCircleQuestion className="w-4 h-4" />
                  </TooltipTrigger>

                  <TooltipContent>
                    <p>
                      Number of trades closed because the price didn't reach either the Take Profit nor Stop Loss.
                    </p>
                    <p>
                      You can adjust the accepted duration by modifying the width of the transaction box on the chart.
                    </p>
                  </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            </div>
            <p className={"text-2xl font-bold"}>
              {stats.tradesTimedOut.toFixed(0)}
            </p>
          </Card>
        </div>
        )}
      </div>
    );
  }
};
