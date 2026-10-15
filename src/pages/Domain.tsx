import { useMemo } from "react";
import { Badge, Banner, ClipboardText, LayerCard, LinkButton, Tabs, Text } from "@cloudflare/kumo";
import { ArrowRightIcon, ChartLineIcon, LockKeyIcon, ListBulletsIcon, WarningIcon } from "@phosphor-icons/react";
import { useStore } from "../lib/store.tsx";
import { useNavigate } from "../lib/router.tsx";
import { useTitle } from "../lib/useTitle.ts";
import { PLAN_LABEL, formatNumber } from "../lib/format.ts";
import { series } from "../data/series.ts";
import type { Domain } from "../data/types.ts";
import { Card, DetailList, PageHeader } from "../components/ui.tsx";
import { DomainStatusBadge } from "../components/badges.tsx";
import { TrafficChart } from "../components/TrafficChart.tsx";
import { DnsTab } from "./DomainDns.tsx";
import { SslTab } from "./DomainSsl.tsx";
import { NotFoundPage } from "./NotFound.tsx";

export type DomainTab = "overview" | "dns" | "ssl";

const TAB_LABEL: Record<DomainTab, string> = { overview: "Overview", dns: "DNS", ssl: "SSL/TLS" };

export function DomainPage({ domain: name, tab }: { domain: string; tab: DomainTab }) {
  const { account } = useStore();
  const navigate = useNavigate();
  const domain = account.domains.find((d) => d.name === name);
  useTitle(domain && TAB_LABEL[tab], domain ? domain.name : "Domain not found");

  if (!domain) {
    return <NotFoundPage title="Domain not found" description={`${name} is not a domain in ${account.name}.`} backHref="/domains" backLabel="Back to domains" />;
  }

  const base = `/domains/${domain.name}`;
  const paths: Record<DomainTab, string> = { overview: base, dns: `${base}/dns`, ssl: `${base}/ssl` };

  return (
    <>
      <PageHeader
        title={<span className="break-all">{domain.name}</span>}
        meta={
          <>
            <DomainStatusBadge status={domain.status} />
            <Badge variant="outline">{PLAN_LABEL[domain.plan]} plan</Badge>
          </>
        }
        description={`Added ${domain.addedOn}. ${formatNumber(domain.requests24h)} requests in the last 24 hours.`}
      />

      <div className="mb-6 overflow-x-auto">
        <Tabs
          variant="underline"
          value={tab}
          onValueChange={(v) => navigate(paths[v as DomainTab])}
          tabs={(Object.keys(TAB_LABEL) as DomainTab[]).map((t) => ({ value: t, label: TAB_LABEL[t] }))}
        />
      </div>

      {domain.status === "pending" && <NameserverBanner domain={domain} />}

      {tab === "overview" && <OverviewTab domain={domain} paths={paths} />}
      {tab === "dns" && <DnsTab domain={domain} />}
      {tab === "ssl" && <SslTab domain={domain} />}
    </>
  );
}

function NameserverBanner({ domain }: { domain: Domain }) {
  return (
    <div className="mb-6">
      <Banner
        variant="alert"
        icon={<WarningIcon weight="fill" aria-hidden="true" />}
        title="Update your nameservers"
        description={
          <div className="flex flex-col gap-3">
            <span>
              Log in to your registrar and replace the nameservers for {domain.name} with these two. Activation usually
              takes a few hours.
            </span>
            <div className="grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
              {domain.nameservers.map((ns) => (
                <ClipboardText key={ns} text={ns} size="base" labels={{ copyAction: `Copy ${ns}` }} />
              ))}
            </div>
          </div>
        }
      />
    </div>
  );
}

function QuickAction({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <LayerCard className="min-w-0">
      <LayerCard.Primary className="flex h-full flex-col gap-3 p-4">
        <span className="flex size-9 items-center justify-center rounded-lg bg-kumo-tint text-kumo-default">{icon}</span>
        <div className="flex-1">
          <Text variant="heading" as="h3">
            {title}
          </Text>
          <Text variant="secondary" size="sm">
            {description}
          </Text>
        </div>
        <div>
          <LinkButton href={href} variant="secondary" size="sm">
            Open {title.toLowerCase()} <ArrowRightIcon size={14} aria-hidden="true" />
          </LinkButton>
        </div>
      </LayerCard.Primary>
    </LayerCard>
  );
}

function OverviewTab({ domain, paths }: { domain: Domain; paths: Record<DomainTab, string> }) {
  const points = useMemo(
    () => [{ name: "Requests", points: series(domain.name, "24h", Math.max(0, Math.round(domain.requests24h / 24))) }],
    [domain.name, domain.requests24h],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Card title="Traffic, last 24 hours" description="Requests per hour, UTC">
            {domain.requests24h > 0 ? (
              <TrafficChart
                series={points}
                hourly
                height={240}
                description={`Line chart of hourly requests to ${domain.name} over the last 24 hours.`}
              />
            ) : (
              <div className="flex h-60 items-center justify-center rounded-lg bg-kumo-tint px-6 text-center">
                <Text variant="secondary">Traffic appears here once the domain is active.</Text>
              </div>
            )}
          </Card>
        </div>
        <Card title="Domain details">
          <DetailList
            compact
            items={[
              { label: "Status", value: <DomainStatusBadge status={domain.status} /> },
              { label: "Plan", value: PLAN_LABEL[domain.plan] },
              { label: "DNS records", value: formatNumber(domain.records.length) },
              { label: "SSL/TLS mode", value: { off: "Off", flexible: "Flexible", full: "Full", strict: "Full (strict)" }[domain.ssl.mode] },
              { label: "Always Use HTTPS", value: domain.ssl.alwaysHttps ? "On" : "Off" },
            ]}
          />
        </Card>
      </div>

      <section aria-labelledby="quick-actions">
        <Text variant="heading" as="h2">
          <span id="quick-actions">Quick actions</span>
        </Text>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          <QuickAction href={paths.dns} icon={<ListBulletsIcon size={18} aria-hidden="true" />} title="DNS records" description="Add, edit and remove the records that point this domain at your services." />
          <QuickAction href={paths.ssl} icon={<LockKeyIcon size={18} aria-hidden="true" />} title="SSL/TLS" description="Choose how traffic between visitors, Cirrusflash and your origin is encrypted." />
          <QuickAction href="/analytics" icon={<ChartLineIcon size={18} aria-hidden="true" />} title="Analytics" description="See requests, bandwidth and the most visited paths across your account." />
        </div>
      </section>

      <Card title="Nameservers" description="Your registrar must point to these Cirrusflash nameservers.">
        <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
          {domain.nameservers.map((ns) => (
            <li key={ns}>
              <ClipboardText text={ns} size="base" labels={{ copyAction: `Copy ${ns}` }} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
