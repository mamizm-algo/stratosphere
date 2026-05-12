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

const normalize = (price: number, min: number, max: number) => {
    return (price - min) / (max - min) + 100;
  }


export const IndividualTradeStatistics = ({ transactionParams, individualOutcome }: TradeStatisticsProps) => {
  
    const getIndividualStats = (): IndividualTradeStats | undefined => {
    if (!transactionParams || !individualOutcome) return undefined;

    const outcomeCandles = individualOutcome.outcomeCandles;

    const setupMin = Math.min(...individualOutcome.setupCandles.map(candle => candle.low));
    const setupMax = Math.max(...individualOutcome.setupCandles.map(candle => candle.high));

    const entryPrice = outcomeCandles[0].open;
    const isLong = transactionParams.position === "long";

    // Calculate duration from startTime and endTime
    const duration = Math.max(1, (transactionParams.endTime as number) - (transactionParams.startTime as number));

    const lastIndex = individualOutcome.setupCandles.length - 1;
    const setupOffset = 100 - normalize(individualOutcome.setupCandles[lastIndex].close, setupMin, setupMax);
    
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

    let result: "win" | "loss" | "timeout" = "timeout";
    let profit = 0;
    let tradeCloseDuration = duration;

    for (let i = 0; i < Math.min(outcomeCandles.length, duration); i++) {
      const candle = outcomeCandles[i];
      if (isLong) {
        if (candle.high >= takeProfitPrice) {
          result = "win";
          profit = profitSize;
          tradeCloseDuration = i + 1;
          break;
        } else if (candle.low <= stopLossPrice) {
          result = "loss";
          profit = -lossSize;
          tradeCloseDuration = i + 1;
          break;
        }
      } else {
        if (candle.low <= takeProfitPrice) {
          result = "win";
          profit = profitSize;
          tradeCloseDuration = i + 1;
          break;
        } else if (candle.high >= stopLossPrice) {
          result = "loss";
          profit = -lossSize;
          tradeCloseDuration = i + 1;
          break;
        }
      }
    }

    if (result === "timeout") {
      const lastCandle = outcomeCandles[Math.min(outcomeCandles.length - 1, duration - 1)];
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
    return;
  } else {
    const individualStats = getIndividualStats();
 
    return (
      <div className="space-y-4">
        {/* Individual Trade Statistics */}
        {individualStats && (
          <Card className="px-4 py-2">
            <h3 className="text-sm font-semibold text-foreground mb-1">Trade Details</h3>
            <div className="grid grid-cols-3 gap-4">
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
