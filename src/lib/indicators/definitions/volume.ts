import { IndicatorDefinition } from "../types";
import { extractVolume } from "../calculations/volume";

export const volumeDefinition: IndicatorDefinition = {
  id: "volume",
  name: "Volume",
  shortName: "Vol",
  renderType: "sub-chart",
  params: [],
  calculate: (candles) => {
    const bars = extractVolume(candles);
    return {
      lines: [],
      histogram: {
        data: bars.map((b) => ({
          time: b.time,
          value: b.value,
          color: b.color,
        })),
      },
    };
  },
};
