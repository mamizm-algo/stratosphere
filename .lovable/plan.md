

# Pane-Aligned Indicator Labels with Crosshair Values

## Overview

Rework the indicator label system to follow the TradingView industry standard: each indicator's label is rendered directly on its chart pane (positioned relative to the pane separator), shows live crosshair values, and provides hover controls (configure/remove) using the ActiveIndicatorsList pattern.

## Current State

- Sub-chart indicators (RSI, MACD, Volume) are added as panes on the main `IChartApi` via `chart.addSeries(..., paneIndex)`.
- Labels are rendered as absolute-positioned HTML divs inside SubChartPanel's wrapper div, but this div doesn't correspond to the actual pane location inside the lightweight-charts canvas.
- Overlay indicators (EMA) are shown in a single `ActiveIndicatorsList` overlay at top-left of the chart.
- No crosshair value tracking exists for any indicator.

## Changes

### 1. Centralized Crosshair Value Tracking

Add a crosshairMove subscription in `IndicatorsLayer` that reads the current value from every tracked series (both overlay and sub-chart). Store these values in state as a map: `{ [instanceId]: { [seriesKey]: number } }`.

This uses `param.seriesData.get(seriesRef)` from the lightweight-charts API to extract the value at the crosshair position for each series.

### 2. Expose Series Refs from SubChartPanel

SubChartPanel currently tracks its series internally. It needs to expose them (via a callback or ref) so the parent `IndicatorsLayer` can include them in the crosshair subscription.

### 3. Pane-Positioned Labels

Determine the vertical position of each chart pane by inspecting the DOM structure of the lightweight-charts container. The library renders each pane as a child element, so we can measure their `offsetTop` and height to position HTML overlay labels at the top-left of each pane.

Each sub-chart indicator label will be absolutely positioned relative to the chart container, aligned to its corresponding pane's top edge.

For overlay indicators on the main pane (pane 0), labels remain at the top-left (below the Indicators button), similar to current behavior.

### 4. Unified Label Component with Hover Controls

Replace both the current `ActiveIndicatorsList` and SubChartPanel's inline label with a single `PaneIndicatorLabel` component that:

- Shows indicator short name + params, e.g., `RSI(14)`
- Shows the current crosshair value next to the name, e.g., `RSI(14) 62.45`
- On hover, reveals config (gear icon) and remove (X icon) buttons
- Uses the same visual style: semi-transparent, small text, non-intrusive

Multiple indicators on the same pane (e.g., MACD signal + line share a pane) are grouped under one label block.

### 5. Remove Old Label from SubChartPanel

The SubChartPanel will no longer render its own label/remove button HTML. It becomes purely responsible for adding series to the correct pane. Label rendering is handled by the parent overlay system.

## Technical Details

### Files Modified

- **`src/components/indicators/IndicatorsLayer.tsx`** -- Add crosshair subscription, collect series refs, render pane-positioned labels, remove old `ActiveIndicatorsList` usage
- **`src/components/indicators/SubChartPanel.tsx`** -- Remove inline label HTML, expose series refs via callback prop
- **`src/components/indicators/ActiveIndicatorsList.tsx`** -- Refactor into a reusable `PaneIndicatorLabel` that renders labels for a group of indicators on a given pane, with crosshair values and hover actions
- **`src/lib/indicators/types.ts`** -- No changes needed (existing types sufficient)

### New Component

- **`src/components/indicators/PaneIndicatorLabel.tsx`** -- Renders one or more indicator labels for a single pane, positioned absolutely. Shows: name, params, live value, hover controls (config/remove). Used for both the main chart pane (overlay indicators) and each sub-chart pane.

### Crosshair Value Format

- For overlay indicators (EMA): show price value formatted to match the price axis
- For RSI: show value rounded to 2 decimals
- For MACD: show MACD line value, signal value, and histogram value
- For Volume: show volume as integer
- When crosshair is not on the chart, show the last available value (or nothing)

### Pane Position Detection

Use a `ResizeObserver` + `MutationObserver` on the chart container to detect pane element positions. The lightweight-charts library renders panes as sequential child table rows or divs. We measure each pane element's `offsetTop` relative to the chart container to position our label overlays.

Alternatively, use `chart.panes()` combined with examining the pane separator DOM elements to calculate offsets.

### Implementation Order

1. Create `PaneIndicatorLabel` component
2. Update `SubChartPanel` to expose series refs via callback, remove inline label
3. Update `IndicatorsLayer` to:
   - Collect all series refs (overlay + sub-chart)
   - Subscribe to `crosshairMove` and extract values per series
   - Detect pane positions in the DOM
   - Render `PaneIndicatorLabel` for each pane with the relevant indicators
4. Remove or repurpose `ActiveIndicatorsList` (its logic moves into PaneIndicatorLabel)

