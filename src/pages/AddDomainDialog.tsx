import { useState, type FormEvent } from "react";
import { Button, Dialog, Input, Radio } from "@cloudflare/kumo";
import { XIcon } from "@phosphor-icons/react";
import { useStore } from "../lib/store.tsx";
import { useNavigate } from "../lib/router.tsx";
import { useToast } from "../lib/toast.ts";
import { validateDomain } from "../lib/validate.ts";
import type { Plan } from "../data/types.ts";

const PLANS: Array<{ value: Plan; label: string; description: string }> = [
  { value: "free", label: "Free", description: "Global CDN, universal SSL and basic DDoS protection." },
  { value: "pro", label: "Pro", description: "Adds image optimization, a web application firewall and faster support." },
  { value: "business", label: "Business", description: "Adds a 100% uptime target, custom certificates and priority support." },
];

export function AddDomainDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { account, dispatch } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<Plan>("free");
  const [submitted, setSubmitted] = useState(false);

  const existing = account.domains.map((d) => d.name);
  const error = submitted ? validateDomain(name, existing) : undefined;

  const reset = () => {
    setName("");
    setPlan("free");
    setSubmitted(false);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (validateDomain(name, existing)) return;
    const domain = name.trim().toLowerCase();
    dispatch({ type: "add-domain", name: domain, plan });
    onOpenChange(false);
    reset();
    toast("Domain added", { description: `${domain} is waiting for its nameservers.` });
    navigate(`/domains/${domain}`);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next: boolean) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <Dialog size="lg" className="p-6 sm:p-8">
        <form onSubmit={onSubmit} noValidate>
          <div className="mb-2 flex items-start justify-between gap-4">
            <Dialog.Title className="text-xl font-semibold">Add a domain</Dialog.Title>
            <Dialog.Close
              render={(props) => <Button {...props} variant="ghost" shape="square" icon={XIcon} aria-label="Close" />}
            />
          </div>
          <Dialog.Description className="mb-6 text-kumo-subtle">
            Enter a domain you own. We will scan its existing DNS records and give you two nameservers to use.
          </Dialog.Description>

          <div className="flex flex-col gap-6">
            <Input
              label="Domain"
              placeholder="example.com"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={error}
              description="Enter the apex domain, without www or https://."
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="none"
              passwordManagerIgnore
              autoFocus
            />
            <Radio.Group legend="Plan" appearance="card" value={plan} onValueChange={(v) => setPlan(v as Plan)}>
              {PLANS.map((p) => (
                <Radio.Item key={p.value} value={p.value} label={p.label} description={p.description} />
              ))}
            </Radio.Group>
          </div>

          <div className="mt-8 flex justify-end gap-2">
            <Dialog.Close render={(props) => <Button {...props} variant="secondary">Cancel</Button>} />
            <Button type="submit" variant="primary">
              Continue
            </Button>
          </div>
        </form>
      </Dialog>
    </Dialog.Root>
  );
}
