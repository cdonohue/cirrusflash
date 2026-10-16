import { useState, type FormEvent } from "react";
import { Banner, Button, Radio, Switch } from "@cloudflare/kumo";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { useStore } from "../lib/store.tsx";
import type { Domain, SslMode } from "../data/types.ts";
import { Card } from "../components/ui.tsx";

const MODES: Array<{ value: SslMode; label: string; description: string }> = [
  { value: "off", label: "Off", description: "No encryption. Visitors can only reach this domain over HTTP. Not recommended." },
  { value: "flexible", label: "Flexible", description: "Encrypts traffic between visitors and Stratobeam. Traffic to your origin stays unencrypted." },
  { value: "full", label: "Full", description: "Encrypts end to end, using any certificate on your origin, including self-signed ones." },
  { value: "strict", label: "Full (strict)", description: "Encrypts end to end and requires a valid, trusted certificate on your origin." },
];

export function SslTab({ domain }: { domain: Domain }) {
  const { dispatch } = useStore();
  const [mode, setMode] = useState<SslMode>(domain.ssl.mode);
  const [alwaysHttps, setAlwaysHttps] = useState(domain.ssl.alwaysHttps);
  const [saved, setSaved] = useState(false);

  const dirty = mode !== domain.ssl.mode || alwaysHttps !== domain.ssl.alwaysHttps;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    dispatch({ type: "save-ssl", domain: domain.name, mode, alwaysHttps });
    setSaved(true);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {saved && !dirty && (
        <div role="status">
          <Banner
            icon={<CheckCircleIcon weight="fill" aria-hidden="true" />}
            title="Settings saved"
            description={`SSL/TLS for ${domain.name} now uses ${MODES.find((m) => m.value === domain.ssl.mode)?.label} mode.`}
          />
        </div>
      )}

      <Card title="Encryption mode" description="How Stratobeam connects to visitors and to your origin server.">
        <Radio.Group
          legend="SSL/TLS encryption mode"
          appearance="card"
          value={mode}
          onValueChange={(v) => {
            setMode(v as SslMode);
            setSaved(false);
          }}
        >
          {MODES.map((m) => (
            <Radio.Item key={m.value} value={m.value} label={m.label} description={m.description} />
          ))}
        </Radio.Group>
      </Card>

      <Card title="Edge certificates" description="Settings that apply to every request at the edge.">
        <Switch
          label="Always Use HTTPS"
          checked={alwaysHttps}
          onCheckedChange={(checked) => {
            setAlwaysHttps(checked);
            setSaved(false);
          }}
        />
        <p className="mt-2 mb-0 text-sm text-kumo-subtle">Redirect every HTTP request to HTTPS with a 301 response.</p>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {dirty && <span className="text-sm text-kumo-subtle">You have unsaved changes.</span>}
        <Button type="submit" variant="primary">
          Save
        </Button>
      </div>
    </form>
  );
}
