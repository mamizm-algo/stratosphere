import { IndicatorDefinition } from "../types";
import { calculateEMA } from "../calculations/ema";

const colors = ["#2196F3", "#f0f321", "#f321c6", "#21e5f3", "#2196F3", "#2196F3"]

export const emaDefinition: IndicatorDefinition = {
  id: "ema",
  name: "Exponential Moving Average",
  shortName: "EMA",
  canBeMultiple: true,
  renderType: "overlay",
  params: [
    { key: "period", label: "Period", type: "number", default: 20, min: 2, max: 500 },
  ],
  calculate: (candles, params) => {
    const closes = candles.map((c) => c.close);
    const result = calculateEMA(closes, params.period);
    return {
      lines: [
        {
          key: "ema",
          label: `EMA(${params.period})`,
          color: colors[params.period % colors.length],
          data: result
            .map((v, i) => ({ time: candles[i].ctm, value: v! }))
            .filter((d) => d.value !== null && d.value !== undefined),
        },
      ],
    };
  },
};
