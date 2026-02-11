import { calculateEMA } from "./ema";

export interface MACDResult {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

export function calculateMACD(
  closes: number[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number
): MACDResult {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  // MACD line = fast EMA - slow EMA
  const macdLine: (number | null)[] = fastEMA.map((fast, i) => {
    const slow = slowEMA[i];
    if (fast === null || slow === null) return null;
    return fast - slow;
  });

  // Signal line = EMA of MACD line
  const macdValues = macdLine.filter((v): v is number => v !== null);
  const signalEMA = calculateEMA(macdValues, signalPeriod);

  // Map signal back to full length
  const signal: (number | null)[] = [];
  let macdIdx = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      signal.push(null);
    } else {
      signal.push(signalEMA[macdIdx] ?? null);
      macdIdx++;
    }
  }

  // Histogram = MACD - Signal
  const histogram: (number | null)[] = macdLine.map((m, i) => {
    const s = signal[i];
    if (m === null || s === null) return null;
    return m - s;
  });

  return { macd: macdLine, signal, histogram };
}
