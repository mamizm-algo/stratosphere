import { CandleData } from "@/components/chart/MockChartDisplay";
import { SimilarPattern } from "@/components/chart/SimilarityResults";

export interface Collection {
  name: string;
  representativeChart: CandleData[]; // The input chart used for similarity search
  results: SimilarPattern[]; // The search results with similarity scores
  createdAt: string;
  updatedAt: string;
}
