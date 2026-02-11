import { IndicatorDefinition } from "../types";
import { calculateEMA } from "../calculations/ema";

export const emaDefinition: IndicatorDefinition = {
  id: "ema",
  name: "Exponential Moving Average",
  shortName: "EMA",
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
          color: "#2196F3",
          data: result
            .map((v, i) => ({ time: candles[i].ctm, value: v! }))
            .filter((d) => d.value !== null && d.value !== undefined),
        },
      ],
    };
  },
};
