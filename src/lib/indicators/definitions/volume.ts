import { IndicatorDefinition } from "../types";
import { extractVolume } from "../calculations/volume";

export const volumeDefinition: IndicatorDefinition = {
  id: "volume",
  name: "Volume",
  shortName: "Vol",
  canBeMultiple: false,
  renderType: "overlay",
  params: [],
  calculate: (candles) => {
    const bars = extractVolume(candles);
    return {
      lines: [],
      histogram: {
        data: bars.map((b) => ({
          time: b.time,
          value: b.volumeValue, 
          color: b.color,
        })),
      },
    };
  },
};