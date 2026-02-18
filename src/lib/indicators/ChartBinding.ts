/**
 * ChartBinding
 *
 * Owns the lifecycle of all lightweight-charts series for a given chart instance.
 * Created fresh whenever a new IChartApi is mounted; disposed when the chart unmounts
 * (while the chart is still alive). Indicator state is held outside this class.
 *
 * Pattern: IndicatorManager (persistent state) → ChartBinding (ephemeral series)
 */

import {
  IChartApi,
  ISeriesApi,
  LineSeries,
  HistogramSeries,
  Time,
} from "lightweight-charts";
import { ActiveIndicator, IndicatorOutput } from "./types";
import { getIndicatorById } from "./registry";
import { CandleData } from "@/components/chart/MockChartDisplay";

export type SeriesMap = Map<string, ISeriesApi<"Line" | "Histogram">[]>;

export type CrosshairValues = {
  [instanceId: string]: { [seriesKey: string]: number | null };
};

export type CrosshairListener = (values: CrosshairValues) => void;

export class ChartBinding {
  private chart: IChartApi;
  private disposed = false;

  /** instanceId → series list (for overlay indicators only) */
  private overlaySeries: SeriesMap = new Map();

  /** instanceId → series list (populated by SubChartPanel via registerSubSeries) */
  private subSeries: SeriesMap = new Map();

  private crosshairUnsub: (() => void) | null = null;
  private crosshairListener: CrosshairListener | null = null;

  constructor(chart: IChartApi) {
    this.chart = chart;
  }

  // ---------------------------------------------------------------------------
  // Overlay series management
  // ---------------------------------------------------------------------------

  /**
   * Full sync of overlay indicators to the chart.
   * Removes series for indicators no longer active, adds/updates the rest.
   * Safe to call repeatedly; idempotent per indicator instance unless params changed.
   */
  syncOverlays(
    indicators: ActiveIndicator[],
    candles: CandleData[]
  ): void {
    if (this.disposed || candles.length === 0) return;

    const activeIds = new Set(indicators.map((i) => i.instanceId));

    // Remove series whose indicator was removed
    for (const [id, seriesList] of this.overlaySeries) {
      if (!activeIds.has(id)) {
        this.removeSeriesList(seriesList);
        this.overlaySeries.delete(id);
      }
    }

    // Add / recalculate
    for (const ind of indicators) {
      const def = getIndicatorById(ind.definitionId);
      if (!def) continue;

      const output: IndicatorOutput = def.calculate(candles, ind.params);

      // Remove the old series for this instance (params may have changed)
      const old = this.overlaySeries.get(ind.instanceId);
      if (old) {
        this.removeSeriesList(old);
      }

      const newSeries: ISeriesApi<"Line" | "Histogram">[] = [];

      for (const line of output.lines) {
        const s = this.chart.addSeries(LineSeries, {
          color: line.color,
          lineWidth: 2,
          priceScaleId: "right",
          priceLineVisible: false,
          lastValueVisible: false,
        });
        s.setData(
          line.data.map((d) => ({
            time: Math.floor(new Date(d.time).getTime() / 1000) as Time,
            value: d.value,
          }))
        );
        newSeries.push(s);
      }

      if (output.histogram) {
        const isVolume = ind.definitionId === "volume";
        const s = this.chart.addSeries(HistogramSeries, {
          priceFormat: isVolume
            ? { type: "volume" as const, precision: 0, minMove: 1 }
            : undefined,
          priceScaleId: isVolume ? "" : "right",
          priceLineVisible: false,
          lastValueVisible: false,
        });
        if (isVolume) {
          s.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
        }
        s.setData(
          output.histogram.data.map((d) => ({
            time: Math.floor(new Date(d.time).getTime() / 1000) as Time,
            value: d.value,
            color: d.color,
          }))
        );
        newSeries.push(s);
      }

      this.overlaySeries.set(ind.instanceId, newSeries);
    }
  }

  // ---------------------------------------------------------------------------
  // Sub-chart series registration (called by SubChartPanel)
  // ---------------------------------------------------------------------------

  registerSubSeries(instanceId: string, series: ISeriesApi<"Line" | "Histogram">[]): void {
    if (series.length === 0) {
      this.subSeries.delete(instanceId);
    } else {
      this.subSeries.set(instanceId, series);
    }
  }

  // ---------------------------------------------------------------------------
  // Crosshair subscription
  // ---------------------------------------------------------------------------

  subscribeCrosshair(
    activeIndicators: ActiveIndicator[],
    candles: CandleData[],
    listener: CrosshairListener
  ): void {
    if (this.disposed) return;

    // Unsubscribe previous handler if any
    this.unsubscribeCrosshair();

    this.crosshairListener = listener;

    const handler = (param: any) => {
      if (this.disposed) return;
      const newValues: CrosshairValues = {};

      const readSeries = (
        seriesMap: SeriesMap,
        indicators: ActiveIndicator[]
      ) => {
        for (const [instanceId, seriesList] of seriesMap) {
          const ind = indicators.find((i) => i.instanceId === instanceId);
          if (!ind) continue;
          const def = getIndicatorById(ind.definitionId);
          if (!def) continue;

          const output = def.calculate(candles, ind.params);
          const vals: Record<string, number | null> = {};
          let idx = 0;

          for (const line of output.lines) {
            const s = seriesList[idx];
            if (s) vals[line.key] = param.seriesData?.get(s)?.value ?? null;
            idx++;
          }
          if (output.histogram && seriesList[idx]) {
            vals["histogram"] = param.seriesData?.get(seriesList[idx])?.value ?? null;
          }

          newValues[instanceId] = vals;
        }
      };

      readSeries(this.overlaySeries, activeIndicators);
      readSeries(this.subSeries, activeIndicators);

      listener(newValues);
    };

    this.chart.subscribeCrosshairMove(handler);
    this.crosshairUnsub = () => {
      try {
        this.chart.unsubscribeCrosshairMove(handler);
      } catch {
        // chart already removed — no-op
      }
    };
  }

  private unsubscribeCrosshair(): void {
    this.crosshairUnsub?.();
    this.crosshairUnsub = null;
  }

  // ---------------------------------------------------------------------------
  // Disposal — call this while the chart is still alive
  // ---------------------------------------------------------------------------

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.unsubscribeCrosshair();

    // Remove overlay series (sub-chart series are owned by the chart pane;
    // they vanish automatically when the chart is removed)
    for (const seriesList of this.overlaySeries.values()) {
      this.removeSeriesList(seriesList);
    }
    this.overlaySeries.clear();
    this.subSeries.clear();
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private removeSeriesList(seriesList: ISeriesApi<"Line" | "Histogram">[]): void {
    for (const s of seriesList) {
      try {
        this.chart.removeSeries(s);
      } catch {
        // Already removed or chart disposed — safe to ignore at the boundary
        // between dispose() being called and chart.remove() being called.
      }
    }
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  get chartApi(): IChartApi {
    return this.chart;
  }
}
