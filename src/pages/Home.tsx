import { useMemo, useState } from "react";
import { Button, LayerCard, Link, Meter, Text } from "@cloudflare/kumo";
import { ClockCounterClockwiseIcon, PlusIcon } from "@phosphor-icons/react";
import { useStore } from "../lib/store.tsx";
import { useTitle } from "../lib/useTitle.ts";
import { formatCompact, formatNumber } from "../lib/format.ts";
import { series } from "../data/series.ts";
import { Card, PageHeader, StatTile } from "../components/ui.tsx";
import { TrafficChart } from "../components/TrafficChart.tsx";
import { AddDomainDialog } from "./AddDomainDialog.tsx";

export function HomePage() {
  const { account } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  useTitle("Account home", account.name);

  const requests = account.domains.reduce((n, d) => n + d.requests24h, 0);
  const chartSeries = useMemo(() => {
    const avg = Math.max(1000, Math.round(requests / 8));
    return [
      { name: "Requests", points: series(`${account.id}-req`, "7d", avg) },
      { name: "Cached", points: series(`${account.id}-cache`, "7d", Math.round(avg * 0.62)) },
    ];
  }, [account.id, requests]);
  const threats = Math.round(requests * 0.0074);
  const recordCount = account.domains.reduce((n, d) => n + d.records.length, 0);

  return (
    <>
      <PageHeader
        title={account.name}
        description="An overview of your domains, applications and traffic across this account."
        actions={
          <Button variant="primary" className="rounded-full" icon={PlusIcon} onClick={() => setAddOpen(true)}>
            Add a domain
          </Button>
        }
      />

      <section aria-labelledby="stats-heading" className="mb-6">
        <h2 id="stats-heading" className="sr-only">
          Account summary
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Domains" value={formatNumber(account.domains.length)} trend={account.id === "acme-robotics" ? 20 : 0} trendLabel="vs. last month" />
          <StatTile label="Workers" value={formatNumber(account.workers.length)} trend={account.id === "acme-robotics" ? 14.3 : 0} trendLabel="vs. last month" />
          <StatTile label="Requests (24h)" value={formatCompact(requests)} trend={12.4} />
          <StatTile label="Threats mitigated" value={formatNumber(threats)} trend={-3.1} goodWhenUp={false} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Card title="Requests, last 7 days" description="All domains, 3-hour buckets, UTC">
            <TrafficChart
              series={chartSeries}
              hourly={false}
              description="Line chart of requests and cached requests per 3 hours over the last 7 days. Traffic peaks each afternoon UTC."
            />
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Recent activity">
            <ol className="m-0 flex list-none flex-col gap-4 p-0">
              {account.activity.slice(0, 5).map((item) => (
                <li key={item.id} className="flex gap-3">
                  <ClockCounterClockwiseIcon size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-kumo-subtle" />
                  <div className="min-w-0">
                    <p className="m-0 text-sm text-kumo-default">
                      <span className="font-medium">{item.actor}</span> {item.action}{" "}
                      <span className="font-medium break-words">{item.target}</span>
                    </p>
                    <p className="m-0 text-xs text-kumo-subtle">{item.at}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Plan usage" description="Billing period Oct 1 – Oct 31, 2026">
            <div className="flex flex-col gap-4">
              <Meter label="Worker requests" value={62} customValue="6.2M / 10M" />
              <Meter label="DNS records" value={recordCount} max={200} customValue={`${recordCount} / 200`} />
            </div>
          </Card>
        </div>
      </div>

      <LayerCard className="mt-6">
        <LayerCard.Primary className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Text variant="heading" as="h2">
              Bring another domain to Stratobeam
            </Text>
            <Text variant="secondary">
              Add a domain, then point its nameservers to us. Read{" "}
              <Link href="/domains">your domain list</Link> to see what is already connected.
            </Text>
          </div>
          <Button variant="secondary" className="rounded-full" icon={PlusIcon} onClick={() => setAddOpen(true)}>
            Add a domain
          </Button>
        </LayerCard.Primary>
      </LayerCard>

      <AddDomainDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
