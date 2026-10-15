import { useMemo, useState } from "react";
import { Button, Dialog, DropdownMenu, Empty, Input, Table } from "@cloudflare/kumo";
import { DotsThreeIcon, ListBulletsIcon, MagnifyingGlassIcon, PencilSimpleIcon, PlusIcon, TrashIcon, WarningIcon } from "@phosphor-icons/react";
import { useStore } from "../lib/store.tsx";
import { useToast } from "../lib/toast.ts";
import { TTL_LABEL } from "../lib/format.ts";
import type { DnsRecord, Domain } from "../data/types.ts";
import { Card } from "../components/ui.tsx";
import { ProxyBadge } from "../components/badges.tsx";
import { DnsRecordDialog } from "./DnsRecordDialog.tsx";

function displayName(record: DnsRecord, domain: string) {
  return record.name === "@" ? domain : record.name;
}

export function DnsTab({ domain }: { domain: Domain }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ open: boolean; record: DnsRecord | null }>({ open: false, record: null });
  const [deleting, setDeleting] = useState<DnsRecord | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return domain.records;
    return domain.records.filter((r) =>
      [r.type, r.name, r.content, displayName(r, domain.name)].some((v) => v.toLowerCase().includes(q)),
    );
  }, [domain.records, domain.name, query]);

  const confirmDelete = () => {
    if (!deleting) return;
    dispatch({ type: "delete-record", domain: domain.name, id: deleting.id });
    toast("Record deleted", { description: `${deleting.type} record for ${displayName(deleting, domain.name)} was removed.` });
    setDeleting(null);
  };

  return (
    <>
      <Card
        title="DNS records"
        description={`Records that tell resolvers where to send traffic for ${domain.name}.`}
        actions={
          <Button variant="primary" icon={PlusIcon} onClick={() => setEditor({ open: true, record: null })}>
            Add DNS record
          </Button>
        }
        flush
      >
        <div className="border-b border-kumo-hairline p-4">
          <div className="sm:w-80">
            <Input
              label="Search DNS records"
              placeholder="Filter by type, name or content"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              passwordManagerIgnore
            />
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="p-8">
            <Empty
              icon={query ? <MagnifyingGlassIcon size={32} aria-hidden="true" /> : <ListBulletsIcon size={32} aria-hidden="true" />}
              title={query ? "No records match your search" : "No DNS records yet"}
              description={query ? "Try another type, name or value." : "Add an A or CNAME record to start sending traffic to your services."}
              contents={
                query ? (
                  <Button variant="secondary" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                ) : (
                  <Button variant="primary" icon={PlusIcon} onClick={() => setEditor({ open: true, record: null })}>
                    Add DNS record
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Type</Table.Head>
                <Table.Head>Name</Table.Head>
                <Table.Head>Content</Table.Head>
                <Table.Head>Proxy status</Table.Head>
                <Table.Head>TTL</Table.Head>
                <Table.Head>
                  <span className="sr-only">Actions</span>
                </Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((r) => {
                const name = displayName(r, domain.name);
                return (
                  <Table.Row key={r.id}>
                    <Table.Cell>
                      <span className="font-mono text-sm font-medium whitespace-nowrap">{r.type}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="whitespace-nowrap">{name}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="block max-w-56 truncate font-mono text-sm sm:max-w-xs" title={r.content}>
                        {r.type === "MX" && r.priority !== undefined && <span className="text-kumo-subtle">{r.priority} </span>}
                        {r.content}
                      </span>
                    </Table.Cell>
                    <Table.Cell>{r.type === "TXT" || r.type === "MX" ? <ProxyBadge proxied={false} /> : <ProxyBadge proxied={r.proxied} />}</Table.Cell>
                    <Table.Cell className="whitespace-nowrap">{TTL_LABEL[r.ttl]}</Table.Cell>
                    <Table.Cell className="text-right">
                      <DropdownMenu>
                        <DropdownMenu.Trigger
                          render={
                            <Button
                              variant="ghost"
                              shape="square"
                              size="sm"
                              icon={DotsThreeIcon}
                              aria-label={`Actions for ${r.type} record ${name}`}
                            />
                          }
                        />
                        <DropdownMenu.Content align="end">
                          <DropdownMenu.Item icon={PencilSimpleIcon} onClick={() => setEditor({ open: true, record: r })}>
                            Edit
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item icon={TrashIcon} variant="danger" onClick={() => setDeleting(r)}>
                            Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        )}
      </Card>
      <p className="mt-3 text-sm text-kumo-subtle" aria-live="polite">
        Showing {rows.length} of {domain.records.length} records
      </p>

      <DnsRecordDialog
        open={editor.open}
        record={editor.record}
        domain={domain.name}
        onOpenChange={(open) => setEditor((e) => ({ ...e, open }))}
        onSaved={(isNew) => toast(isNew ? "Record added" : "Record updated")}
      />

      <Dialog.Root open={deleting !== null} onOpenChange={(open: boolean) => !open && setDeleting(null)} role="alertdialog">
        <Dialog size="base" className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-kumo-danger-tint text-kumo-danger">
              <WarningIcon size={20} weight="fill" aria-hidden="true" />
            </span>
            <Dialog.Title className="text-lg font-semibold">Delete DNS record?</Dialog.Title>
          </div>
          <Dialog.Description className="text-kumo-subtle">
            {deleting && (
              <>
                The {deleting.type} record for <strong className="text-kumo-default">{displayName(deleting, domain.name)}</strong> pointing
                to <strong className="break-all text-kumo-default">{deleting.content}</strong> will stop resolving. This cannot be undone.
              </>
            )}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close render={(props) => <Button {...props} variant="secondary">Cancel</Button>} />
            <Button variant="destructive" onClick={confirmDelete}>
              Delete record
            </Button>
          </div>
        </Dialog>
      </Dialog.Root>
    </>
  );
}
