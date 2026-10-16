import { useMemo, useState } from "react";
import { Button, Empty, Input, Link, Select, Table } from "@cloudflare/kumo";
import { GlobeHemisphereWestIcon, MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { useStore } from "../lib/store.tsx";
import { useTitle } from "../lib/useTitle.ts";
import { PLAN_LABEL, formatNumber } from "../lib/format.ts";
import type { DomainStatus } from "../data/types.ts";
import { Card, PageHeader } from "../components/ui.tsx";
import { DOMAIN_STATUS_LABEL, DomainStatusBadge } from "../components/badges.tsx";
import { AddDomainDialog } from "./AddDomainDialog.tsx";

type StatusFilter = "all" | DomainStatus;

const STATUS_ITEMS: Record<StatusFilter, string> = {
  all: "All statuses",
  active: DOMAIN_STATUS_LABEL.active,
  pending: DOMAIN_STATUS_LABEL.pending,
  moved: DOMAIN_STATUS_LABEL.moved,
};

export function DomainsPage() {
  const { account } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [addOpen, setAddOpen] = useState(false);
  useTitle("Domains", account.name);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return account.domains.filter((d) => (status === "all" || d.status === status) && (!q || d.name.includes(q)));
  }, [account.domains, query, status]);

  const filtered = query.trim() !== "" || status !== "all";

  return (
    <>
      <PageHeader
        title="Domains"
        description="Domains you have added to this account. Select a domain to manage its DNS records and SSL/TLS."
        actions={
          <Button variant="primary" icon={PlusIcon} className="rounded-full" onClick={() => setAddOpen(true)}>
            Add a domain
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-80">
          <Input
            label="Search domains"
            placeholder="Filter by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            autoComplete="off"
            passwordManagerIgnore
          />
        </div>
        <div className="sm:w-56">
          <Select
            label="Status"
            className="w-full"
            value={status}
            onValueChange={(v) => setStatus((v as StatusFilter | null) ?? "all")}
            items={STATUS_ITEMS}
          />
        </div>
      </div>

      <Card flush label="Domains">
        {rows.length === 0 ? (
          <div className="p-8">
            <Empty
              icon={filtered ? <MagnifyingGlassIcon size={32} aria-hidden="true" /> : <GlobeHemisphereWestIcon size={32} aria-hidden="true" />}
              title={filtered ? "No domains match your filters" : "No domains yet"}
              description={filtered ? "Try a different name or status." : "Add a domain to start routing its traffic through Stratobeam."}
              contents={
                filtered ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuery("");
                      setStatus("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button variant="primary" icon={PlusIcon} onClick={() => setAddOpen(true)}>
                    Add a domain
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Domain</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>Plan</Table.Head>
                <Table.Head className="text-right">Requests (24h)</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((d) => (
                <Table.Row key={d.name}>
                  <Table.Cell>
                    <Link href={`/domains/${d.name}`} className="font-medium">
                      {d.name}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <DomainStatusBadge status={d.status} />
                  </Table.Cell>
                  <Table.Cell>{PLAN_LABEL[d.plan]}</Table.Cell>
                  <Table.Cell className="tabular text-right">{formatNumber(d.requests24h)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>
      <p className="mt-3 text-sm text-kumo-subtle" aria-live="polite">
        Showing {rows.length} of {account.domains.length} domains
      </p>

      <AddDomainDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
