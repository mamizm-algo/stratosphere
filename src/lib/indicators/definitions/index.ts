import { emaDefinition } from "./ema";
import { rsiDefinition } from "./rsi";
import { macdDefinition } from "./macd";
import { volumeDefinition } from "./volume";
import { IndicatorDefinition } from "../types";

export const allIndicatorDefinitions: IndicatorDefinition[] = [
  emaDefinition,
  rsiDefinition,
  macdDefinition,
  volumeDefinition,
];
