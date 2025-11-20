import { CandleData } from "@/components/chart/MockChartDisplay";

/**
 * Candle data source module
 * 
 * This module will serve as the central source for candle data.
 * Currently uses mock data, but can be updated to import from a JSON file.
 * 
 * To use real data:
 * 1. Add your candle data JSON file to src/data/
 * 2. Import it: import candleDataJson from './candle-data.json'
 * 3. Replace the CANDLE_DATA constant with the imported data
 */

// Placeholder for candle data
// Replace this with imported JSON data when ready
export const CANDLE_DATA: Record<string, CandleData[]> = {
  // Format: "ASSET_TIMEFRAME": CandleData[]
  // Example: "BTC/USD_1h": [...candles],
  // This will be populated from JSON import
};

/**
 * Get candles for a specific asset and timeframe
 * @param asset - Asset identifier (e.g., "BTC/USD")
 * @param timeframe - Timeframe (e.g., "1h", "4h", "1d")
 * @param dateFrom - Optional start date filter
 * @param dateTo - Optional end date filter
 * @returns Array of candle data
 */
export const getCandles = (
  asset: string,
  timeframe: string,
  dateFrom?: string,
  dateTo?: string
): CandleData[] => {
  const key = `${asset}_${timeframe}`;
  const candles = CANDLE_DATA[key] || [];
  
  if (!dateFrom && !dateTo) {
    return candles;
  }
  
  // Filter by date range if provided
  return candles.filter((candle) => {
    if (!candle.timestamp) return true;
    const candleTime = new Date(candle.timestamp).getTime();
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
    const toTime = dateTo ? new Date(dateTo).getTime() : Infinity;
    return candleTime >= fromTime && candleTime <= toTime;
  });
};

/**
 * Get available assets from the data source
 */
export const getAvailableAssets = (): string[] => {
  const assets = new Set<string>();
  Object.keys(CANDLE_DATA).forEach((key) => {
    const asset = key.split("_")[0];
    assets.add(asset);
  });
  return Array.from(assets);
};

/**
 * Get available timeframes for a specific asset
 */
export const getAvailableTimeframes = (asset: string): string[] => {
  const timeframes = new Set<string>();
  Object.keys(CANDLE_DATA).forEach((key) => {
    const [assetPart, timeframe] = key.split("_");
    if (assetPart === asset) {
      timeframes.add(timeframe);
    }
  });
  return Array.from(timeframes);
};
