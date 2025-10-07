import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Clock } from "lucide-react";

export interface TradeStats {
  winRate: number;
  avgProfit: number;
  totalTrades: number;
  avgDuration?: number;
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
  stats: TradeStats;
  individualStats?: IndividualTradeStats;
}

export const TradeStatistics = ({ stats, individualStats }: TradeStatisticsProps) => {
  return (
    <div className="space-y-4">
      {/* General Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Win Rate</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.winRate.toFixed(1)}%</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {stats.avgProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-bullish" />
            ) : (
              <TrendingDown className="w-4 h-4 text-bearish" />
            )}
            <span className="text-xs text-muted-foreground">Avg Profit</span>
          </div>
          <p className={`text-2xl font-bold ${stats.avgProfit >= 0 ? "text-bullish" : "text-bearish"}`}>
            {stats.avgProfit >= 0 ? "+" : ""}
            {stats.avgProfit.toFixed(2)}%
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Trades</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalTrades}</p>
        </Card>

        {stats.avgDuration && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Avg Duration</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.avgDuration.toFixed(1)} candles</p>
          </Card>
        )}
      </div>

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
};
