

# Modular Technical Indicators System

## Overview

A reusable, data-driven indicators framework that can be plugged into any chart in the app. Each indicator is defined as a single object (calculation + config schema + render type), and the system handles all state, UI, and rendering automatically.

## Architecture

### File Structure

```text
src/lib/indicators/
  types.ts              -- Core types (IndicatorDefinition, ActiveIndicator, etc.)
  registry.ts           -- Indicator registry + lookup helpers
  calculations/
    ema.ts              -- Pure EMA calculation
    rsi.ts              -- Pure RSI calculation
    macd.ts             -- Pure MACD calculation
    volume.ts           -- Pure Volume extraction
  definitions/
    ema.ts              -- EMA IndicatorDefinition (params, calculate, renderType: "overlay")
    rsi.ts              -- RSI IndicatorDefinition (params, calculate, renderType: "sub-chart")
    macd.ts             -- MACD IndicatorDefinition (params, calculate, renderType: "sub-chart")
    volume.ts           -- Volume IndicatorDefinition (params, calculate, renderType: "sub-chart")
    index.ts            -- Re-exports all definitions into registry array

src/hooks/useIndicators.ts  -- Core hook: manages active indicators, params, add/remove/configure

src/components/indicators/
  IndicatorsButton.tsx         -- "Indicators" button overlay on chart
  IndicatorPickerDialog.tsx    -- Modal listing available indicators to add
  ActiveIndicatorsList.tsx     -- Overlay panel showing active indicators with hover actions
  IndicatorConfigDialog.tsx    -- Generic config modal (renders fields from param schema)
  SubChartPanel.tsx            -- Renders a single sub-chart (RSI/MACD/Volume) using lightweight-charts
  IndicatorsLayer.tsx          -- Main orchestrator: renders overlay series + sub-chart panels + UI
```

### Core Types (`src/lib/indicators/types.ts`)

```typescript
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

export interface IndicatorOutput {
  lines: { key: string; label: string; color: string; data: IndicatorSeriesData[] }[];
  histogram?: { data: { time: number; value: number; color: string }[] };
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
  instanceId: string;        // unique per added instance
  definitionId: string;
  params: Record<string, number>;
}
```

### Indicator Definitions (one example: EMA)

```typescript
// src/lib/indicators/definitions/ema.ts
export const emaDefinition: IndicatorDefinition = {
  id: "ema",
  name: "Exponential Moving Average",
  shortName: "EMA",
  renderType: "overlay",
  params: [
    { key: "period", label: "Period", type: "number", default: 20, min: 2, max: 500 }
  ],
  calculate: (candles, params) => {
    const result = calculateEMA(candles.map(c => c.close), params.period);
    return {
      lines: [{
        key: "ema",
        label: `EMA(${params.period})`,
        color: "#2196F3",
        data: result.map((v, i) => ({ time: candles[i].ctm, value: v })).filter(d => d.value !== null)
      }]
    };
  }
};
```

RSI, MACD, and Volume follow the same pattern. MACD returns multiple lines plus a histogram. Volume returns histogram data.

### `useIndicators` Hook

Manages the list of active indicators, their params, and provides add/remove/configure actions:

```typescript
function useIndicators() {
  const [activeIndicators, setActiveIndicators] = useState<ActiveIndicator[]>([]);

  const addIndicator = (definitionId: string) => { ... };
  const removeIndicator = (instanceId: string) => { ... };
  const updateParams = (instanceId: string, params: Record<string, number>) => { ... };

  return { activeIndicators, addIndicator, removeIndicator, updateParams };
}
```

### `IndicatorsLayer` Component

The main orchestrator component. It receives:
- `chartApi` ref (the main lightweight-charts instance)
- `candles` (CandleData array)
- The hook state from `useIndicators`

It handles:
1. **Overlay indicators** (EMA): Adds/removes `LineSeries` on the main chart via `chartApi`
2. **Sub-chart indicators** (RSI, MACD, Volume): Renders `SubChartPanel` components below the main chart, each creating its own lightweight-charts instance
3. **UI overlays**: Renders `IndicatorsButton`, `ActiveIndicatorsList`, `IndicatorPickerDialog`, and `IndicatorConfigDialog`

### `SubChartPanel` Component

A self-contained sub-chart that:
- Creates its own `createChart` instance in a container with a fixed height (e.g., 150px)
- Syncs its time scale with the main chart using `timeScale().subscribeVisibleLogicalRangeChange`
- Renders line series and/or histogram data from the indicator output
- Shows the indicator name as a label
- Responds to resize via ResizeObserver

### UI Components

- **IndicatorsButton**: Small button positioned absolute top-right of the chart container. Opens the picker dialog.
- **IndicatorPickerDialog**: Dialog listing all registered indicators with an "Add" button per indicator. Already-active indicators show a checkmark but can be added again (e.g., two EMAs with different periods).
- **ActiveIndicatorsList**: Fixed overlay panel (top-right, below the button) listing active indicators. On hover per item, shows config (gear) and remove (X) icons.
- **IndicatorConfigDialog**: Generic dialog that renders input fields dynamically from the indicator definition's `params` array. Validates positive numbers and required fields. On confirm, triggers recalculation.

## Integration in AssetBrowser

The AssetBrowser chart area will be restructured slightly:

```tsx
// Inside AssetBrowser return
<div className="relative">
  {/* Main chart container */}
  <div ref={chartRef} className="w-full h-[600px]" />

  {/* Indicators UI overlay (positioned absolute) */}
  <IndicatorsLayer
    chartApiRef={chartApiRef}
    candles={candles}
    indicators={activeIndicators}
    onAdd={addIndicator}
    onRemove={removeIndicator}
    onConfigure={updateParams}
  />
</div>

{/* Sub-chart panels rendered below */}
{subChartIndicators.map(indicator => (
  <SubChartPanel
    key={indicator.instanceId}
    indicator={indicator}
    candles={candles}
    mainChartApi={chartApiRef.current}
  />
))}
```

The `useIndicators` hook is called in AssetBrowser. The same hook + IndicatorsLayer can later be dropped into any other chart view with zero logic changes.

## Implementation Steps

1. Create `src/lib/indicators/types.ts` with all type definitions
2. Create pure calculation functions: `ema.ts`, `rsi.ts`, `macd.ts`, `volume.ts`
3. Create indicator definitions that wire calculations to the schema
4. Create the registry (`index.ts` exporting all definitions)
5. Create `useIndicators` hook
6. Create UI components: `IndicatorsButton`, `IndicatorPickerDialog`, `ActiveIndicatorsList`, `IndicatorConfigDialog`
7. Create `SubChartPanel` component
8. Create `IndicatorsLayer` orchestrator component
9. Integrate into AssetBrowser (add hook + layer, restructure chart container to allow sub-panels)

## Mobile Responsiveness

- The indicators button and active list use compact sizing on small screens
- Sub-chart panels stack below the main chart and take full width
- Dialogs use standard responsive dialog patterns already in the app

## Extensibility

Adding a new indicator (e.g., Bollinger Bands) requires only:
1. Write `calculations/bollinger.ts` (pure function)
2. Write `definitions/bollinger.ts` (one object with params + calculate + renderType)
3. Add to registry array in `definitions/index.ts`

No UI changes needed.

