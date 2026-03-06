import { CandleData } from "@/components/chart/MockChartDisplay";

/**
 * Rounds a timestamp to the nearest timeframe boundary.
 * For example, with a 5-minute timeframe:
 * - :02 → :00
 * - :07 → :05
 * - :23 → :20
 */
export function roundTimestampToTimeframe(
  timestampMs: number,
  timeframeMinutes: number
): number {
  const timeframeMs = timeframeMinutes * 60 * 1000;
  return Math.floor(timestampMs / timeframeMs) * timeframeMs;
}

/**
 * Aggregates candles from a smaller timeframe (1m) into a larger timeframe.
 * - OHLC: Open from first candle, High from max, Low from min, Close from last
 * - Volume: Sum of all volumes
 * - Timestamp: Rounded start of the timeframe window
 *
 * Example: [1m candles at :00, :01, :02, :03, :04] → [one 5m candle at :00]
 */
export function aggregateCandles(
  candles: CandleData[],
  timeframeMinutes: number
): CandleData[] {
  // If empty or already at target timeframe (1m), return as-is
  if (candles.length === 0 || timeframeMinutes === 1) {
    return candles;
  }

  // Group candles by timeframe window
  const candlesByTimeframe = new Map<number, CandleData[]>();

  for (const candle of candles) {
    // Parse timestamp from ctm (assuming milliseconds)
    const timestampMs = typeof candle.ctm === "number"
      ? candle.ctm  // If ctm is in seconds, convert to milliseconds
      : candle.ctm;

    // Get the rounded timestamp for this timeframe
    const roundedTimestampMs = roundTimestampToTimeframe(
      timestampMs,
      timeframeMinutes
    );

    // Add to the group for this timeframe window
    if (!candlesByTimeframe.has(roundedTimestampMs)) {
      candlesByTimeframe.set(roundedTimestampMs, []);
    }
    candlesByTimeframe.get(roundedTimestampMs)!.push(candle);
  }

  // Convert groups to aggregated candles
  const aggregated: CandleData[] = [];

  // Sort keys to maintain chronological order
  const sortedKeys = Array.from(candlesByTimeframe.keys()).sort(
    (a, b) => a - b
  );

  for (const timeframeMs of sortedKeys) {
    const group = candlesByTimeframe.get(timeframeMs)!;

    if (group.length === 0) continue;

    // Calculate OHLC
    const open = group[0].open;
    const close = group[group.length - 1].close;
    const high = Math.max(...group.map((c) => c.high));
    const low = Math.min(...group.map((c) => c.low));
    const vol = group.reduce((sum, c) => sum + (c.vol ?? 0), 0);

    // Convert timestamp back to the original format
    // If ctm was in seconds, convert back to seconds
    const ctmInSeconds = Math.floor(timeframeMs);

    aggregated.push({
      open,
      close,
      high,
      low,
      vol,
      ctm: ctmInSeconds,
    });
  }

  return aggregated;
}

/**
 * Detects the timeframe from a string like "5m" and returns minutes.
 */
export function parseTimeframe(timeframeStr: string): number {
  const match = timeframeStr.match(/^(\d+)m$/);
  if (!match) throw new Error(`Invalid timeframe format: ${timeframeStr}`);
  return parseInt(match[1], 10);
}
