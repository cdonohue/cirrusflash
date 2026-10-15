import { useMemo, type ComponentProps } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import {
  AriaComponent,
  BrushComponent,
  GridComponent,
  MarkLineComponent,
  ToolboxComponent,
  TooltipComponent,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import { ChartLegend, ChartPalette, TimeseriesChart } from "@cloudflare/kumo";
import { useTheme } from "../lib/theme.tsx";
import { formatCompact, formatNumber, formatTick } from "../lib/format.ts";

// Kumo does not export this type from its entry point.
type TimeseriesData = ComponentProps<typeof TimeseriesChart>["data"][number];

// TimeseriesChart builds its option with aria, brush, toolbox and markLine,
// so all of those must be registered or ECharts logs warnings.
echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  AriaComponent,
  BrushComponent,
  ToolboxComponent,
  MarkLineComponent,
  SVGRenderer,
]);

/*
 * Screenshots must be stable, so the chart never animates. TimeseriesChart
 * has no animation prop; wrapping init() lets us force `animation: false` on
 * every setOption and pick the SVG renderer (crisper, no canvas timing).
 */
const stillEcharts = {
  ...echarts,
  init: ((dom: HTMLElement, theme?: string | object | null, opts?: Parameters<typeof echarts.init>[2]) => {
    const chart = echarts.init(dom, theme, { ...opts, renderer: "svg" });
    const setOption = chart.setOption.bind(chart) as (...args: unknown[]) => void;
    (chart as { setOption: unknown }).setOption = (option: { aria?: { label?: { description?: string } } }, ...rest: unknown[]) => {
      setOption({ ...option, animation: false }, ...rest);
      // ECharts only writes aria-label when its locale's aria strings are
      // registered, which the tree-shaken core build may skip. The container
      // already has role="img", so it must carry the description itself.
      const description = option.aria?.label?.description;
      if (description) dom.setAttribute("aria-label", description);
    };
    // Kumo's own ResizeObserver skips its first callback, so a chart that
    // initialises before layout settles can stay 0px wide. Resize on every
    // observed size change instead.
    const observer = new ResizeObserver(() => {
      if (chart.isDisposed()) observer.disconnect();
      else chart.resize();
    });
    observer.observe(dom);
    return chart;
  }) as typeof echarts.init,
} as typeof echarts;

export interface SeriesInput {
  name: string;
  points: [number, number][];
}

interface TrafficChartProps {
  series: SeriesInput[];
  /** Hour labels (true) or day labels (false) on the time axis. */
  hourly: boolean;
  height?: number;
  description: string;
  yAxisName?: string;
}

export function TrafficChart({ series, hourly, height = 260, description, yAxisName }: TrafficChartProps) {
  const { mode } = useTheme();
  const isDark = mode === "dark";
  const data: TimeseriesData[] = useMemo(
    () => series.map((s, i) => ({ name: s.name, data: s.points, color: ChartPalette.categorical(i, isDark) })),
    [series, isDark],
  );

  return (
    <figure className="m-0">
      {series.length > 1 && (
        <figcaption className="mb-3 flex flex-wrap gap-4">
          {data.map((s, i) => (
            <ChartLegend.SmallItem
              key={s.name}
              name={s.name}
              color={s.color}
              value={formatCompact(series[i]!.points.reduce((a, [, v]) => a + v, 0))}
            />
          ))}
        </figcaption>
      )}
      {series.length <= 1 && <figcaption className="sr-only">{description}</figcaption>}
      <TimeseriesChart
        // Remount when the mode flips: ECharts applies its theme only at init.
        key={isDark ? "dark" : "light"}
        echarts={stillEcharts}
        isDarkMode={isDark}
        data={data}
        type="line"
        gradient
        height={height}
        yAxisName={yAxisName}
        xAxisTickFormat={(v) => formatTick(v, hourly)}
        yAxisTickFormat={(v) => formatCompact(v)}
        tooltipValueFormat={(v) => formatNumber(v)}
        tooltipFollowCursor="x"
        ariaDescription={description}
      />
    </figure>
  );
}
