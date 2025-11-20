import { CandleData } from "@/components/chart/MockChartDisplay";
import { SearchConfig } from "@/components/chart/SimilaritySearchDialog";

/**
 * Similarity Calculator Module
 * 
 * This module calculates similarity scores between a reference pattern and candidate patterns.
 * Currently contains a mockup implementation that returns random scores.
 * 
 * TODO: Implement real similarity calculation algorithm
 * Considerations for real implementation:
 * - Pattern matching algorithms (DTW, correlation, etc.)
 * - Price normalization
 * - Volume analysis
 * - Timeframe adjustments
 * - Technical indicator matching
 */

export interface SimilarityCalculationParams {
  referencePattern: CandleData[]; // The pattern to search for
  candidatePattern: CandleData[]; // The pattern to compare against
  searchConfig: SearchConfig; // Search filters and parameters
}

/**
 * Calculate similarity score between two candlestick patterns
 * 
 * @param params - Calculation parameters including reference pattern, candidate pattern, and search config
 * @returns Similarity score between 0-100 (higher is more similar)
 * 
 * Current implementation: MOCKUP - Returns random scores
 * TODO: Replace with real similarity algorithm
 */
export const calculateSimilarityScore = (
  params: SimilarityCalculationParams
): number => {
  const { referencePattern, candidatePattern, searchConfig } = params;

  const similarityResult = similarity_pair_by_optimal_k(referencePattern.map(refCandle => refCandle.close), candidatePattern.map(candCandle => candCandle.close));
  console.log(100*similarityResult[0]);
  
  // // MOCKUP IMPLEMENTATION
  // // TODO: Replace this with real similarity calculation
  
  // // For now, generate a random score that respects the similarity threshold
  // const minScore = searchConfig.similarityThreshold || 70;
  // const maxScore = 100;
  // const randomScore = Math.random() * (maxScore - minScore) + minScore;
  
  // Return score rounded to nearest integer
  return Math.round(100*similarityResult[0]);
};

/**
 * Calculate similarity for multiple candidate patterns
 * 
 * @param referencePattern - The reference pattern to compare against
 * @param candidatePatterns - Array of candidate patterns to evaluate
 * @param searchConfig - Search configuration
 * @returns Array of similarity scores corresponding to each candidate
 */
export const calculateBatchSimilarity = (
  referencePattern: CandleData[],
  candidatePatterns: CandleData[][],
  searchConfig: SearchConfig
): number[] => {
  return candidatePatterns.map((candidatePattern) =>
    calculateSimilarityScore({
      referencePattern,
      candidatePattern,
      searchConfig,
    })
  );
};

/**
 * Filter patterns by similarity threshold
 * 
 * @param patterns - Array of patterns with their similarity scores
 * @param threshold - Minimum similarity score to include
 * @returns Filtered array of patterns
 */
export const filterBySimilarityThreshold = <T extends { similarity: number }>(
  patterns: T[],
  threshold: number
): T[] => {
  return patterns.filter((pattern) => pattern.similarity >= threshold);
};

/**
 * Normalize candle data for comparison
 * Helper function for future real implementation
 * 
 * TODO: Implement normalization logic
 * - Price normalization (percentage-based)
 * - Volume normalization
 * - Time alignment
 */
export const normalizePattern = (candles: CandleData[]): CandleData[] => {
  // MOCKUP: Return as-is
  // TODO: Implement normalization
  return candles;
};

/**
 * Extract pattern features for comparison
 * Helper function for future real implementation
 * 
 * TODO: Implement feature extraction
 * - Price patterns (trends, reversals, etc.)
 * - Volume patterns
 * - Technical indicators
 * - Statistical features
 */
export interface PatternFeatures {
  // TODO: Define feature structure
  trend?: string;
  volatility?: number;
  volumeProfile?: number[];
  // Add more features as needed
}

export const extractPatternFeatures = (
  candles: CandleData[]
): PatternFeatures => {
  // MOCKUP: Return empty features
  // TODO: Implement feature extraction
  return {};
};

/**
 * Search result interface
 */
export interface SearchResult {
  id: string;
  similarity: number;
  asset: string;
  timeframe: string;
  date: string;
  outcome: "bullish" | "bearish" | "neutral";
  setupCandles: CandleData[];
  outcomeCandles: CandleData[];
  startIndex: number;
  endIndex: number;
}

/**
 * Search through all candle data to find similar patterns
 * 
 * @param referencePattern - The pattern to search for
 * @param allCandleData - All available candle data (keyed by "ASSET_TIMEFRAME")
 * @param searchConfig - Search configuration including filters
 * @returns Array of search results sorted by similarity (highest first)
 */
export const searchSimilarPatterns = (
  referencePattern: CandleData[],
  allCandleData: Record<string, CandleData[]>,
  searchConfig: SearchConfig
): SearchResult[] => {
  const results: SearchResult[] = [];
  const patternLength = referencePattern.length;
  const outcomeLength = 80; // Default outcome bars to display
  const maxResults = 50; // Maximum number of results to return
  
  // Iterate through all assets and timeframes in the search config
  searchConfig.assets.forEach((asset) => {
    searchConfig.timeframes.forEach((timeframe) => {
      const key = `${asset}_${timeframe}`;
      const candles = allCandleData[key];
      
      if (!candles || candles.length < patternLength + outcomeLength) {
        return; // Skip if not enough data
      }
      
      // Apply date filters if specified
      let filteredCandles = candles;
      if (searchConfig.dateFrom || searchConfig.dateTo) {
        filteredCandles = candles.filter((candle) => {
          if (!candle.ctm) return true;
          const candleTime = new Date(candle.ctm).getTime();
          const fromTime = searchConfig.dateFrom ? new Date(searchConfig.dateFrom).getTime() : 0;
          const toTime = searchConfig.dateTo ? new Date(searchConfig.dateTo).getTime() : Infinity;
          return candleTime >= fromTime && candleTime <= toTime;
        });
      }
      
      // Use sliding window to find all possible patterns
      for (let i = 0; i <= filteredCandles.length - patternLength - outcomeLength; i++) {
        const candidatePattern = filteredCandles.slice(i, i + patternLength);
        const outcomeCandles = filteredCandles.slice(i + patternLength, i + patternLength + outcomeLength);
        
        // Calculate similarity score
        const similarity = calculateSimilarityScore({
          referencePattern,
          candidatePattern,
          searchConfig,
        });
        
        // Filter by threshold
        if (similarity >= (searchConfig.similarityThreshold || 70)) {
          // Determine outcome based on price movement
          const setupLastPrice = candidatePattern[candidatePattern.length - 1].close;
          const outcomeLastPrice = outcomeCandles[outcomeCandles.length - 1].close;
          const priceChange = ((outcomeLastPrice - setupLastPrice) / setupLastPrice) * 100;
          
          let outcome: "bullish" | "bearish" | "neutral" = "neutral";
          if (priceChange > 2) outcome = "bullish";
          else if (priceChange < -2) outcome = "bearish";
          
          results.push({
            id: `${asset}_${timeframe}_${i}_${Date.now()}`,
            similarity,
            asset,
            timeframe,
            date: candidatePattern[0].ctm?.toISOString() || new Date().toISOString(),
            outcome,
            setupCandles: candidatePattern,
            outcomeCandles,
            startIndex: i,
            endIndex: i + patternLength - 1,
          });
        }
      }
    });
  });
  
  // Sort by similarity (highest first) and limit results
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);
};

export function approximate_series_even_indices(series: number[], k: number): [number[], number[]] {
    /**
     * Return tuple (indices, values) for approximation with k points (including first and last).
     * indices are integers into original series.
     */
    const n = series.length;
    let idx: number[];

    if (k >= n) {
        idx = Array.from({ length: n }, (_, i) => i);
    } else {
        idx = Array.from({ length: k }, (_, i) => Math.round(i * (n - 1) / (k - 1)));
        // ensure uniqueness & sorted (rounding may create duplicates)
        idx = Array.from(new Set(idx)).sort((a, b) => a - b);

        // if dedup reduced below k, expand by adding missing indices evenly
        let i_try = 0;
        while (idx.length < k) {
            const cand = Math.round(i_try * (n - 1) / (k - 1));
            if (!idx.includes(cand)) idx.push(cand);
            i_try += 1;
        }
        idx.sort((a, b) => a - b);
    }

    const vals = idx.map(i => series[i]);
    return [idx, vals];
}

// ---------------------------
// Rule generation & checking
// ---------------------------
export function generate_pairwise_rules(values: number[]): [number, number, number][] {
    /**
     * values: list of numbers (approximation values)
     * returns list of (i, j, rel) for all i<j where rel in {1,0,-1}
     */
    const k = values.length;
    const rules: [number, number, number][] = [];
    for (let i = 0; i < k; i++) {
        for (let j = i + 1; j < k; j++) {
            let r: number;
            if (values[j] > values[i]) r = 1;
            else if (values[j] < values[i]) r = -1;
            else r = 0;
            rules.push([i, j, r]);
        }
    }
    return rules;
}

export function count_broken_rules_against(values_target: number[], rules: [number, number, number][]): number {
    /**
     * values_target: list of numbers (approximation of the compared chart),
     *                must have the same length as the source used to create the rules.
     * rules: list of (i, j, rel). Indices refer to positions within the approx arrays (0..k-1)
     */
    let broken = 0;
    const totalRules = rules.length;
    for (const [i, j, rel] of rules) {
        const a = values_target[i];
        const b = values_target[j];
        let r: number;
        if (b > a) r = 1;
        else if (b < a) r = -1;
        else r = 0;

        if (r !== rel) {
            broken += (totalRules - j + 1) / totalRules;
        }
    }
    return broken;
}

export function find_optimal_k_relative(seriesA: number[], seriesB: number[]): [number, number, number, number, number] {
    /**
     * For k in 2..N, build approxA_k and approxB_k, generate rules from A_k,
     * compute broken rules when applied to B_k as broken/k.
     * Choose k that minimizes broken/k; on ties choose largest k.
     * Return (best_k, broken_count, total_rules, broken_ratio, total_broken)
     */
    const nA = seriesA.length;
    const nB = seriesB.length;
    if (nA !== nB) {
        console.warn("Series lengths differ - truncating to min length for approximation.");
    }
    const n = Math.min(nA, nB);

    let best_k = 2;
    let best_ratio = Infinity;
    let best_broken: number | null = null;
    let best_total_rules: number | null = null;
    let best_total_broken: number | null = null;
    const total_rules = n * (n - 1) / 2;

    for (let k = 2; k <= n; k++) {
        const [idxA, valsA] = approximate_series_even_indices(seriesA.slice(0, n), k);
        const [idxB, valsB] = approximate_series_even_indices(seriesB.slice(0, n), k);

        if (valsA.length !== valsB.length) continue;

        const rulesA = generate_pairwise_rules(valsA);
        const broken = count_broken_rules_against(valsB, rulesA);

        const total_broken = valsA.length * (valsA.length - 1) / 2;
        const ratio = broken / total_broken + (total_rules - rulesA.length) / total_rules;

        if (ratio < best_ratio || (Math.abs(ratio - best_ratio) < 1e-9 && k > best_k)) {
            best_ratio = ratio;
            best_k = k;
            best_broken = broken;
            best_total_broken = total_broken;
            best_total_rules = rulesA.length;
        }
    }

    return [best_k, best_broken!, best_total_rules!, best_ratio, best_total_broken!];
}

export function similarity_pair_by_optimal_k(seriesA: number[], seriesB: number[]): [number, Record<string, number>] {
    /**
     * Computes kA (optimal for A relative to B) and kB (optimal for B relative to A)
     * and returns similarity = (kA/len + kB/len) / 2 along with diagnostic info.
     */
    let nA = seriesA.length;
    let nB = seriesB.length;
    const n = Math.min(nA, nB);

    if (nA !== nB) {
        console.warn("Series lengths differ - truncating to min length for similarity calculation.");
        seriesA = seriesA.slice(0, n);
        seriesB = seriesB.slice(0, n);
    }

    const [k, broken, total_rules, ratio, total_broken] = find_optimal_k_relative(seriesA, seriesB);
    const sim = 1 - ratio;

    const info = {
        n: n,
        k: k,
        broken: broken,
        total_broken: total_broken,
        total_rules: total_rules,
        ratio: ratio,
        similarity: sim
    };

    return [sim, info];
}

