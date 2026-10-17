import { useMemo, useState } from "react";
import { Meter, Table, Tabs } from "@cloudflare/kumo";
import { useStore } from "../lib/store.tsx";
import { useTitle } from "../lib/useTitle.ts";
import { formatCompact, formatNumber } from "../lib/format.ts";
import { series, sum, topPaths, type RangeKey } from "../data/series.ts";
import { Card, PageHeader, StatTile } from "../components/ui.tsx";
import { TrafficChart } from "../components/TrafficChart.tsx";

const RANGES: Record<RangeKey, { label: string; long: string; trendLabel: string }> = {
  "24h": { label: "24h", long: "last 24 hours", trendLabel: "vs. previous 24h" },
  "7d": { label: "7d", long: "last 7 days", trendLabel: "vs. previous 7 days" },
  "30d": { label: "30d", long: "last 30 days", trendLabel: "vs. previous 30 days" },
};

const TRENDS: Record<RangeKey, [number, number, number]> = {
  "24h": [12.4, 8.1, -2.3],
  "7d": [6.7, 4.9, 1.2],
  "30d": [18.2, 15.6, 3.4],
};

export function AnalyticsPage() {
  const { account } = useStore();
  const [range, setRange] = useState<RangeKey>("7d");
  useTitle("Analytics", account.name);

  const data = useMemo(() => {
    const daily = Math.max(1000, account.domains.reduce((n, d) => n + d.requests24h, 0));
    const perBucket = range === "24h" ? daily / 24 : range === "7d" ? daily / 8 : daily;
    const requests = series(`${account.id}-a-req`, range, Math.round(perBucket));
    const cached = series(`${account.id}-a-cache`, range, Math.round(perBucket * 0.64));
    const totalRequests = sum(requests);
    const totalCached = sum(cached);
    return {
      chart: [
        { name: "Requests", points: requests },
        { name: "Cached", points: cached },
      ],
      totalRequests,
      cacheRatio: Math.round((totalCached / totalRequests) * 1000) / 10,
      bandwidthGb: Math.round(totalRequests * 0.000041 * 10) / 10,
      visitors: Math.round(totalRequests * 0.083),
      paths: topPaths(totalRequests),
    };
  }, [account, range]);

  const [reqTrend, bwTrend, visitorTrend] = TRENDS[range];
  const { long, trendLabel } = RANGES[range];

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`Requests and cached requests across all domains in ${account.name}.`}
        actions={
          <div role="group" aria-label="Date range">
            <Tabs
              variant="segmented"
              value={range}
              onValueChange={(v) => setRange(v as RangeKey)}
              tabs={(Object.keys(RANGES) as RangeKey[]).map((r) => ({ value: r, label: RANGES[r].label }))}
            />
          </div>
        }
      />

      <section aria-labelledby="analytics-summary" className="mb-6">
        <h2 id="analytics-summary" className="sr-only">
          Summary for the {long}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total requests" value={formatCompact(data.totalRequests)} trend={reqTrend} trendLabel={trendLabel} />
          <StatTile label="Bandwidth" value={`${formatNumber(data.bandwidthGb)} GB`} trend={bwTrend} trendLabel={trendLabel} />
          <StatTile label="Unique visitors" value={formatCompact(data.visitors)} trend={visitorTrend} trendLabel={trendLabel} />
          <Card>
            <Meter label="Cache hit ratio" value={data.cacheRatio} customValue={`${data.cacheRatio.toFixed(1)}%`} />
          </Card>
        </div>
      </section>

      <div className="flex flex-col gap-6">
        <Card title="Requests" description={`Requests and cached requests, ${long}, UTC`}>
          <TrafficChart
            series={data.chart}
            hourly={range === "24h"}
            height={300}
            description={`Line chart of total and cached requests over the ${long}.`}
          />
        </Card>

        <Card title="Most requested paths" description={`Paths by number of requests, ${long}`} flush>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Path</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head className="text-right">Requests</Table.Head>
                <Table.Head className="text-right">Share</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.paths.map((p) => (
                <Table.Row key={p.path}>
                  <Table.Cell className="font-mono text-sm">{p.path}</Table.Cell>
                  <Table.Cell className="font-mono text-sm">{p.status}</Table.Cell>
                  <Table.Cell className="tabular text-right">{formatNumber(p.requests)}</Table.Cell>
                  <Table.Cell className="tabular text-right">{((p.requests / data.totalRequests) * 100).toFixed(1)}%</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card>
      </div>
    </>
  );
}
