import { useMemo, useState } from "react";
import { Badge, Empty, Input, Link, LinkButton, Table } from "@cloudflare/kumo";
import { CodeIcon, MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { useStore } from "../lib/store.tsx";
import { useTitle } from "../lib/useTitle.ts";
import { formatNumber } from "../lib/format.ts";
import { Card, PageHeader } from "../components/ui.tsx";

export function WorkersPage() {
  const { account } = useStore();
  const [query, setQuery] = useState("");
  useTitle("Workers & Pages", account.name);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? account.workers.filter((w) => w.name.includes(q)) : account.workers;
  }, [account.workers, query]);

  return (
    <>
      <PageHeader
        title="Workers & Pages"
        description="Serverless applications and static sites that run on the Stratobeam network."
        actions={
          <LinkButton href="/workers/create" variant="primary" icon={PlusIcon}>
            Create application
          </LinkButton>
        }
      />

      <div className="mb-4 sm:w-80">
        <Input
          label="Search applications"
          placeholder="Filter by name"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          passwordManagerIgnore
        />
      </div>

      <Card className="[&>*:last-child]:p-0" label="Applications">
        {rows.length === 0 ? (
          <div className="p-8">
            <Empty
              icon={query ? <MagnifyingGlassIcon size={32} aria-hidden="true" /> : <CodeIcon size={32} aria-hidden="true" />}
              title={query ? "No applications match your search" : "No applications yet"}
              description={query ? "Try a different name." : "Create a Worker or a Pages site to get started."}
              contents={
                <LinkButton href="/workers/create" variant="primary" icon={PlusIcon}>
                  Create application
                </LinkButton>
              }
            />
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Name</Table.Head>
                <Table.Head>Type</Table.Head>
                <Table.Head>Last deployed</Table.Head>
                <Table.Head className="text-right">Requests (24h)</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((w) => (
                <Table.Row key={w.name}>
                  <Table.Cell>
                    <Link href={`/workers/${w.name}`} className="font-medium">
                      {w.name}
                    </Link>
                    <span className="block text-xs text-kumo-subtle">{w.name}.stratobeam.example</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={w.type === "pages" ? "teal" : "blue"}>{w.type === "pages" ? "Pages" : "Worker"}</Badge>
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">{w.lastDeployed}</Table.Cell>
                  <Table.Cell className="tabular text-right">{formatNumber(w.requests24h)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>
      <p className="mt-3 text-sm text-kumo-subtle" aria-live="polite">
        Showing {rows.length} of {account.workers.length} applications
      </p>
    </>
  );
}
