import { useState, type FormEvent } from "react";
import { Banner, Button, Dialog, Input, Select, Switch, Text } from "@cloudflare/kumo";
import { WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { useStore } from "../lib/store.tsx";
import { TTL_LABEL } from "../lib/format.ts";
import {
  CONTENT_FIELD,
  validatePriority,
  validateRecordContent,
  validateRecordName,
} from "../lib/validate.ts";
import type { DnsRecord, DnsType, Ttl } from "../data/types.ts";

const TYPES: Record<DnsType, string> = { A: "A", AAAA: "AAAA", CNAME: "CNAME", TXT: "TXT", MX: "MX" };
const PROXYABLE: DnsType[] = ["A", "AAAA", "CNAME"];

interface Props {
  open: boolean;
  record: DnsRecord | null;
  domain: string;
  onOpenChange: (open: boolean) => void;
  onSaved: (isNew: boolean) => void;
}

export function DnsRecordDialog({ open, record, domain, onOpenChange, onSaved }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(next: boolean) => onOpenChange(next)}>
      <Dialog size="lg" className="p-6 sm:p-8">
        <RecordForm
          key={record?.id ?? "new"}
          record={record}
          domain={domain}
          onDone={(isNew) => {
            onOpenChange(false);
            onSaved(isNew);
          }}
        />
      </Dialog>
    </Dialog.Root>
  );
}

function RecordForm({ record, domain, onDone }: { record: DnsRecord | null; domain: string; onDone: (isNew: boolean) => void }) {
  const { dispatch } = useStore();
  const [type, setType] = useState<DnsType>(record?.type ?? "A");
  const [name, setName] = useState(record?.name ?? "");
  const [content, setContent] = useState(record?.content ?? "");
  const [priority, setPriority] = useState(record?.priority !== undefined ? String(record.priority) : "10");
  const [proxied, setProxied] = useState(record?.proxied ?? true);
  const [ttl, setTtl] = useState<Ttl>(record?.ttl ?? "auto");
  const [submitted, setSubmitted] = useState(false);

  const canProxy = PROXYABLE.includes(type);
  const field = CONTENT_FIELD[type];
  const errors = {
    name: validateRecordName(name),
    content: validateRecordContent(type, content),
    priority: type === "MX" ? validatePriority(priority) : undefined,
  };
  const errorCount = Object.values(errors).filter(Boolean).length;
  const show = (e: string | undefined) => (submitted ? e : undefined);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (errorCount > 0) return;
    const base = {
      type,
      name: name.trim(),
      content: content.trim(),
      proxied: canProxy && proxied,
      ttl,
    };
    dispatch({
      type: "save-record",
      domain,
      id: record?.id,
      record: type === "MX" ? { ...base, priority: Number(priority) } : base,
    });
    onDone(record === null);
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="mb-2 flex items-start justify-between gap-4">
        <Dialog.Title className="text-xl font-semibold">{record ? "Edit DNS record" : "Add DNS record"}</Dialog.Title>
        <Dialog.Close render={(props) => <Button {...props} variant="ghost" shape="square" icon={XIcon} aria-label="Close" />} />
      </div>
      <Dialog.Description className="mb-6 text-kumo-subtle">
        {record ? "Change this record. Updates take effect within a few seconds." : `Add a record to ${domain}.`}
      </Dialog.Description>

      {submitted && errorCount > 0 && (
        <div className="mb-4" role="alert">
          <Banner
            size="sm"
            variant="error"
            icon={<WarningCircleIcon weight="fill" aria-hidden="true" />}
            description={`Fix ${errorCount === 1 ? "the highlighted field" : `the ${errorCount} highlighted fields`} to save this record.`}
          />
        </div>
      )}

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Select
            label="Type"
            className="w-full"
            value={type}
            onValueChange={(v) => setType((v as DnsType | null) ?? "A")}
            items={TYPES}
          />
          <Select
            label="TTL"
            className="w-full"
            value={ttl}
            onValueChange={(v) => setTtl((v as Ttl | null) ?? "auto")}
            items={TTL_LABEL}
          />
        </div>
        <Input
          label="Name"
          placeholder="@ or www"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={show(errors.name)}
          description={`Use @ for ${domain}.`}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          passwordManagerIgnore
        />
        <div className={type === "MX" ? "grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_8rem]" : ""}>
          <Input
            label={field.label}
            placeholder={field.placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            error={show(errors.content)}
            description={field.description}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
            passwordManagerIgnore
            className="w-full font-mono"
          />
          {type === "MX" && (
            <Input
              label="Priority"
              inputMode="numeric"
              placeholder="10"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              error={show(errors.priority)}
              description="Lower is tried first."
              autoComplete="off"
              passwordManagerIgnore
              className="w-full"
            />
          )}
        </div>
        {canProxy ? (
          <Switch label="Proxy through Stratobeam" checked={proxied} onCheckedChange={setProxied} />
        ) : (
          <Text variant="secondary" size="sm">
            {type} records are DNS only and cannot be proxied.
          </Text>
        )}
      </div>

      <div className="mt-8 flex justify-end gap-2">
        <Dialog.Close render={(props) => <Button {...props} variant="secondary">Cancel</Button>} />
        <Button type="submit" variant="primary">
          Save
        </Button>
      </div>
    </form>
  );
}
