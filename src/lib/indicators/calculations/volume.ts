import { CandleData } from "@/components/chart/MockChartDisplay";

export interface VolumeBar {
  time: number;
  value: number;
  color: string;
}

export function extractVolume(candles: CandleData[]): VolumeBar[] {
  return candles.map((c) => ({
    time: c.ctm,
    value: c.vol ?? 0,
    color: c.close >= c.open ? "rgba(38, 166, 154, 0.6)" : "rgba(239, 83, 80, 0.6)",
  }));
}
