import { stableHash } from "./seed.ts";

/*
 * Fixed chart series. Shapes come from a daily sine wave plus a hashed
 * wobble, so they look organic but are identical on every load.
 */

export type RangeKey = "24h" | "7d" | "30d";

const HOUR = 3_600_000;
// The demo's "now": Oct 9, 2026 14:00 UTC.
export const SERIES_END = Date.UTC(2026, 9, 9, 14, 0, 0);

const RANGES: Record<RangeKey, { points: number; step: number }> = {
  "24h": { points: 25, step: HOUR },
  "7d": { points: 57, step: 3 * HOUR },
  "30d": { points: 31, step: 24 * HOUR },
};

function wobble(seed: string, i: number): number {
  return ((stableHash(`${seed}:${i}`) % 1000) / 1000 - 0.5) * 0.16;
}

/** Points as [timestamp_ms, value] for a series with the given daily average per bucket. */
export function series(seed: string, range: RangeKey, average: number): [number, number][] {
  const { points, step } = RANGES[range];
  const start = SERIES_END - (points - 1) * step;
  const out: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const t = start + i * step;
    const hour = new Date(t).getUTCHours();
    const day = new Date(t).getUTCDay();
    const daily = range === "30d" ? 0 : 0.32 * Math.sin(((hour - 9) / 24) * 2 * Math.PI);
    const weekend = day === 0 || day === 6 ? -0.12 : 0;
    const trend = range === "30d" ? (i / points) * 0.18 : 0;
    const value = average * (1 + daily + weekend + trend + wobble(seed, i));
    out.push([t, Math.max(0, Math.round(value))]);
  }
  return out;
}

export function sum(points: [number, number][]): number {
  return points.reduce((acc, [, v]) => acc + v, 0);
}

export interface TopPath {
  path: string;
  requests: number;
  status: string;
}

const TOP_PATH_BASE: Array<[string, number, string]> = [
  ["/", 0.24, "200"],
  ["/api/v2/robots", 0.17, "200"],
  ["/api/v2/telemetry", 0.13, "200"],
  ["/shop/servos", 0.09, "200"],
  ["/assets/app.js", 0.08, "200"],
  ["/docs/getting-started", 0.06, "200"],
  ["/login", 0.04, "302"],
  ["/api/v1/legacy", 0.02, "410"],
];

export function topPaths(total: number): TopPath[] {
  return TOP_PATH_BASE.map(([path, share, status]) => ({ path, requests: Math.round(total * share), status }));
}
