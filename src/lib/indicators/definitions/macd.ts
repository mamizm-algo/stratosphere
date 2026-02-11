import { IndicatorDefinition } from "../types";
import { calculateMACD } from "../calculations/macd";

export const macdDefinition: IndicatorDefinition = {
  id: "macd",
  name: "MACD",
  shortName: "MACD",
  renderType: "sub-chart",
  params: [
    { key: "fastPeriod", label: "Fast Period", type: "number", default: 12, min: 2, max: 100 },
    { key: "slowPeriod", label: "Slow Period", type: "number", default: 26, min: 2, max: 200 },
    { key: "signalPeriod", label: "Signal Period", type: "number", default: 9, min: 2, max: 50 },
  ],
  calculate: (candles, params) => {
    const closes = candles.map((c) => c.close);
    const { macd, signal, histogram } = calculateMACD(
      closes,
      params.fastPeriod,
      params.slowPeriod,
      params.signalPeriod
    );

    const paramLabel = `${params.fastPeriod},${params.slowPeriod},${params.signalPeriod}`;

    return {
      lines: [
        {
          key: "macd",
          label: `MACD(${paramLabel})`,
          color: "#2196F3",
          data: macd
            .map((v, i) => ({ time: candles[i].ctm, value: v! }))
            .filter((d) => d.value !== null && d.value !== undefined),
        },
        {
          key: "signal",
          label: `Signal(${paramLabel})`,
          color: "#FF9800",
          data: signal
            .map((v, i) => ({ time: candles[i].ctm, value: v! }))
            .filter((d) => d.value !== null && d.value !== undefined),
        },
      ],
      histogram: {
        data: histogram
          .map((v, i) => ({
            time: candles[i].ctm,
            value: v!,
            color: v !== null && v >= 0 ? "rgba(38, 166, 154, 0.6)" : "rgba(239, 83, 80, 0.6)",
          }))
          .filter((d) => d.value !== null && d.value !== undefined),
      },
    };
  },
};
