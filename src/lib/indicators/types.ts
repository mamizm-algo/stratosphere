import { CandleData } from "@/components/chart/MockChartDisplay";

export interface IndicatorParam {
  key: string;
  label: string;
  type: "number";
  default: number;
  min?: number;
  max?: number;
}

export type RenderType = "overlay" | "sub-chart";

export interface IndicatorSeriesData {
  time: number;
  value: number;
}

export interface IndicatorLineData {
  key: string;
  label: string;
  color: string;
  data: IndicatorSeriesData[];
}

export interface IndicatorHistogramData {
  time: number;
  value: number;
  color: string;
}

export interface IndicatorOutput {
  lines: IndicatorLineData[];
  histogram?: { data: IndicatorHistogramData[] };
}

export interface IndicatorDefinition {
  id: string;
  name: string;
  shortName: string;
  renderType: RenderType;
  params: IndicatorParam[];
  calculate: (candles: CandleData[], params: Record<string, number>) => IndicatorOutput;
}

export interface ActiveIndicator {
  instanceId: string;
  definitionId: string;
  params: Record<string, number>;
}
