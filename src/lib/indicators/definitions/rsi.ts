import { IndicatorDefinition } from "../types";
import { calculateRSI } from "../calculations/rsi";

export const rsiDefinition: IndicatorDefinition = {
  id: "rsi",
  name: "Relative Strength Index",
  shortName: "RSI",
  renderType: "sub-chart",
  params: [
    { key: "period", label: "Period", type: "number", default: 14, min: 2, max: 100 },
  ],
  calculate: (candles, params) => {
    const closes = candles.map((c) => c.close);
    const result = calculateRSI(closes, params.period);
    return {
      lines: [
        {
          key: "rsi",
          label: `RSI(${params.period})`,
          color: "#AB47BC",
          data: result
            .map((v, i) => ({ time: candles[i].ctm, value: v! }))
            .filter((d) => d.value !== null && d.value !== undefined),
        },
      ],
    };
  },
};
