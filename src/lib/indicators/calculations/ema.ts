export function calculateEMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  if (values.length === 0 || period < 1) return result;

  const k = 2 / (period + 1);
  let ema: number | null = null;

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (ema === null) {
      // SMA for the first EMA value
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += values[j];
      }
      ema = sum / period;
      result.push(ema);
    } else {
      ema = values[i] * k + ema * (1 - k);
      result.push(ema);
    }
  }

  return result;
}
