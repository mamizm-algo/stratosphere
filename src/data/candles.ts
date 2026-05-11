// import { CandleData } from "@/components/chart/MockChartDisplay";
// import candleDataJson from './candle-data.json'
// /**
//  * Candle data source module
//  * 
//  * This module will serve as the central source for candle data.
//  * 
//  */

// console.log("Processing candles")
// const candleData: CandleData[] = candleDataJson.slice(0, 11000).map(c => ({ ...c }));
// console.log(candleData.length);
// export const CANDLE_DATA: Record<string, CandleData[]> = {"GOLD_1m": candleData.map((candle_json) => {
//   return {
//     open: (candle_json.open)/100,
//     close: (candle_json.open + candle_json.close)/100,
//     high: (candle_json.open + candle_json.high)/100,
//     low: (candle_json.open + candle_json.low)/100,
//     ctm: candle_json.ctm,
//     vol: candle_json.vol
//   }
// })};
//  //{
//   // Format: "ASSET_TIMEFRAME": CandleData[]
//   // Example: "BTC/USD_1h": [...candles],
//   // This will be populated from JSON import
// //};

// /**
//  * Get candles for a specific asset and timeframe
//  * @param asset - Asset identifier (e.g., "BTC/USD")
//  * @param timeframe - Timeframe (e.g., "1h", "4h", "1d")
//  * @param dateFrom - Optional start date filter
//  * @param dateTo - Optional end date filter
//  * @returns Array of candle data
//  */
// export const getCandles = (
//   asset: string,
//   timeframe: string,
//   dateFrom?: string,
//   dateTo?: string
// ): CandleData[] => {
//   const key = `${asset}_${timeframe}`;
//   const candles = CANDLE_DATA[key] || [];
  
//   if (!dateFrom && !dateTo) {
//     return candles;
//   }
  
//   // Filter by date range if provided
//   return candles.filter((candle) => {
//     if (!candle.ctm) return true;
//     const candleTime = new Date(candle.ctm).getTime();
//     const fromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
//     const toTime = dateTo ? new Date(dateTo).getTime() : Infinity;
//     return candleTime >= fromTime && candleTime <= toTime;
//   });
// };

// /**
//  * Get available assets from the data source
//  */
// export const getAvailableAssets = (): string[] => {
//   const assets = new Set<string>();
//   Object.keys(CANDLE_DATA).forEach((key) => {
//     const asset = key.split("_")[0];
//     assets.add(asset);
//   });
//   return Array.from(assets);
// };

// /**
//  * Get available timeframes for a specific asset
//  */
// export const getAvailableTimeframes = (asset: string): string[] => {
//   const timeframes = new Set<string>();
//   Object.keys(CANDLE_DATA).forEach((key) => {
//     const [assetPart, timeframe] = key.split("_");
//     if (assetPart === asset) {
//       timeframes.add(timeframe);
//     }
//   });
//   return Array.from(timeframes);
// };


import { CandleData } from "@/components/chart/MockChartDisplay";

export const loadCandleData = async (): Promise<Record<string, CandleData[]>> => {
  const module = await import('./candle-data.json'); // dynamic import
  const candleDataJson: any[] = module.default;

  // const candleData: CandleData[] = candleDataJson.slice(0, 11000).map(c => ({ ...c }));
  const candleData: CandleData[] = candleDataJson.map(c => ({ ...c }));

  const CANDLE_DATA: Record<string, CandleData[]> = {
    "GOLD_1m": candleData.map((candle_json) => {
      return {
        open: candle_json.open / 100,
        close: (candle_json.open + candle_json.close) / 100,
        high: (candle_json.open + candle_json.high) / 100,
        low: (candle_json.open + candle_json.low) / 100,
        ctm: candle_json.ctm,
        vol: candle_json.vol
      };
    })
  };

  console.log("Loaded candles:", CANDLE_DATA["GOLD_1m"].length);
  return CANDLE_DATA;
};


export const getCandles = async (
  asset: string,
  timeframe: string,
  dateFrom?: string,
  dateTo?: string
): Promise<CandleData[]> => {
  const CANDLE_DATA = await loadCandleData();
  const key = `${asset}_${timeframe}`;
  const candles = CANDLE_DATA[key] || [];

  if (!dateFrom && !dateTo) return candles;

  return candles.filter((candle) => {
    if (!candle.ctm) return true;
    const candleTime = new Date(candle.ctm).getTime();
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
    const toTime = dateTo ? new Date(dateTo).getTime() : Infinity;
    return candleTime >= fromTime && candleTime <= toTime;
  });
};


