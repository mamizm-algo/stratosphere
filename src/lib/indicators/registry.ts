import { allIndicatorDefinitions } from "./definitions";
import { IndicatorDefinition } from "./types";

export function getIndicatorDefinitions(): IndicatorDefinition[] {
  return allIndicatorDefinitions;
}

export function getIndicatorById(id: string): IndicatorDefinition | undefined {
  return allIndicatorDefinitions.find((d) => d.id === id);
}
