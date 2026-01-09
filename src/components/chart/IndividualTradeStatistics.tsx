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

export interface IndividualTradeStats {
  profit: number;
  similarity: number;
  asset: string;
  timeframe: string;
  date: string;
  outcome: "win" | "loss" | "timeout";
}

interface TradeStatisticsProps {
  individualOutcome?: SimilarPattern;
  individualStats?: IndividualTradeStats;
    transactionParams?: TransactionBoxModel | null;

}

export const IndividualTradeStatistics = ({ transactionParams, individualOutcome }: TradeStatisticsProps) => {
  
    const getIndividualStats = (): IndividualTradeStats | undefined => {
    if (!transactionParams || !individualOutcome) return undefined;

    const outcomeCandles = individualOutcome.outcomeCandles;

    const entryPrice = outcomeCandles[0].open;
    const isLong = transactionParams.position === "long";
    const takeProfitPrice = entryPrice * (1 + transactionParams.profitSize / 100);
    const stopLossPrice = entryPrice * (1 + transactionParams.lossSize / 100);

    let result: "win" | "loss" | "timeout" = "timeout";
    let profit = 0;
    let duration = transactionParams.duration;

    for (let i = 0; i < Math.min(outcomeCandles.length, transactionParams.duration); i++) {
      const candle = outcomeCandles[i];
      if (isLong) {
        if (candle.high >= takeProfitPrice) {
          result = "win";
          profit = transactionParams.profitSize;
          duration = i + 1;
          break;
        } else if (candle.low <= stopLossPrice) {
          result = "loss";
          profit = transactionParams.lossSize;
          duration = i + 1;
          break;
        }
      } else {
        if (candle.low <= takeProfitPrice) {
          result = "win";
          profit = Math.abs(transactionParams.profitSize);
          duration = i + 1;
          break;
        } else if (candle.high >= stopLossPrice) {
          result = "loss";
          profit = -transactionParams.lossSize;
          duration = i + 1;
          break;
        }
      }
    }

    if (result === "timeout") {
      const lastCandle = outcomeCandles[Math.min(outcomeCandles.length - 1, transactionParams.duration - 1)];
      profit = isLong
        ? ((lastCandle.close - entryPrice) / entryPrice) * 100
        : ((entryPrice - lastCandle.close) / entryPrice) * 100;
    }

    return {
      profit,
      similarity: individualOutcome.similarity,
      asset: individualOutcome.asset,
      timeframe: individualOutcome.timeframe,
      date: individualOutcome.date,
      outcome: result,
    };
  };


  if (!transactionParams){
    console.log("returning empty")
    return;
  } else {
    const individualStats = getIndividualStats();
 
    return (
      <div className="space-y-4">
        {/* Individual Trade Statistics */}
        {individualStats && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Trade Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Profit/Loss</p>
                <p className={`text-xl font-bold ${individualStats.profit >= 0 ? "text-bullish" : "text-bearish"}`}>
                  {individualStats.profit >= 0 ? "+" : ""}
                  {individualStats.profit.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Similarity Score</p>
                <p className="text-xl font-bold text-primary">{individualStats.similarity}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Asset</p>
                <p className="text-sm font-semibold text-foreground">{individualStats.asset}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Timeframe</p>
                <p className="text-sm font-semibold text-foreground">{individualStats.timeframe}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Date</p>
                <p className="text-sm font-semibold text-foreground">{individualStats.date}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Outcome</p>
                <p className={`text-sm font-semibold ${
                  individualStats.outcome === "win" ? "text-bullish" : 
                  individualStats.outcome === "loss" ? "text-bearish" : 
                  "text-muted-foreground"
                }`}>
                  {individualStats.outcome.toUpperCase()}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }
};
