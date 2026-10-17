import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, ClipboardText, LayerCard, Radio, Text, Input, cn } from "@cloudflare/kumo";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, RocketLaunchIcon } from "@phosphor-icons/react";
import { useStore } from "../lib/store.tsx";
import { useNavigate } from "../lib/router.tsx";
import { useTitle } from "../lib/useTitle.ts";
import { useToast } from "../lib/toast.ts";
import { validateWorkerName } from "../lib/validate.ts";
import type { Template } from "../data/types.ts";
import { DetailList, PageHeader } from "../components/ui.tsx";

export const TEMPLATES: Array<{ value: Template; label: string; description: string; kind: string }> = [
  { value: "hello-world", label: "Hello World", description: "A minimal Worker that answers every request with a greeting.", kind: "Worker" },
  { value: "static-site", label: "Static site", description: "Serve HTML, CSS and images from the edge with Pages.", kind: "Pages" },
  { value: "api-gateway", label: "API gateway", description: "Route, authenticate and rate-limit requests to your backend APIs.", kind: "Worker" },
];

const STEPS = ["Template", "Name", "Review"] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="m-0 mb-6 flex list-none items-center gap-2 p-0 sm:gap-4" aria-label="Progress">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-4" aria-current={active ? "step" : undefined}>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1",
                  done && "bg-kumo-contrast text-kumo-inverse ring-kumo-contrast",
                  active && "bg-kumo-base text-kumo-default ring-2 ring-kumo-focus",
                  !done && !active && "bg-kumo-base text-kumo-subtle ring-kumo-line",
                )}
              >
                {done ? <CheckIcon size={14} weight="bold" aria-hidden="true" /> : i + 1}
              </span>
              <span className={cn("text-sm", active ? "font-medium text-kumo-default" : "text-kumo-subtle")}>
                {label}
                <span className="sr-only">{done ? " (completed)" : active ? " (current step)" : ""}</span>
              </span>
            </span>
            {i < STEPS.length - 1 && <span aria-hidden="true" className="h-px w-6 bg-kumo-line sm:w-12" />}
          </li>
        );
      })}
    </ol>
  );
}

export function CreateWorkerPage() {
  const { account, dispatch } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState<Template>("hello-world");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timer = useRef<number | undefined>(undefined);
  useTitle("Create application", account.name);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Move focus to the step heading so keyboard and screen reader users land
  // on the new content after Next/Back.
  const goTo = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const existing = account.workers.map((w) => w.name);
  const nameError = validateWorkerName(name, existing);
  const chosen = TEMPLATES.find((t) => t.value === template)!;
  const previewHost = `${name || "your-app"}.stratobeam.example`;

  const onNameSubmit = (event: FormEvent) => {
    event.preventDefault();
    setNameTouched(true);
    if (!nameError) goTo(2);
  };

  const deploy = () => {
    setDeploying(true);
    // A fixed delay keeps the flow deterministic while still showing the
    // loading state a real deploy would have.
    timer.current = window.setTimeout(() => {
      dispatch({ type: "create-worker", name, template });
      toast(`Deployed ${name}`);
      navigate(`/workers/${name}`, { state: { deployed: true } });
    }, 600);
  };

  return (
    <>
      <PageHeader title="Create an application" description="Pick a starting point, name it, and deploy it to the Stratobeam network." />
      <StepIndicator current={step} />

      <LayerCard>
        <LayerCard.Primary className="p-5 sm:p-6">
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <Text variant="heading" as="h2">
                <span ref={headingRef} tabIndex={-1} className="outline-none">
                  Step 1: Choose a template
                </span>
              </Text>
              <Radio.Group legend="Template" appearance="card" value={template} onValueChange={(v) => setTemplate(v as Template)}>
                {TEMPLATES.map((t) => (
                  <Radio.Item key={t.value} value={t.value} label={`${t.label} (${t.kind})`} description={t.description} />
                ))}
              </Radio.Group>
              <div className="flex justify-end">
                <Button variant="primary" className="uppercase" onClick={() => goTo(1)}>
                  Next
                  <ArrowRightIcon size={16} aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={onNameSubmit} noValidate className="flex flex-col gap-6">
              <Text variant="heading" as="h2">
                <span ref={headingRef} tabIndex={-1} className="outline-none">
                  Step 2: Name your application
                </span>
              </Text>
              <div className="max-w-md">
                <Input
                  label="Application name"
                  placeholder="my-first-app"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => name && setNameTouched(true)}
                  error={nameTouched ? nameError : undefined}
                  description="3 to 40 characters: lowercase letters, digits and hyphens."
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="none"
                  passwordManagerIgnore
                />
              </div>
              <div className="max-w-md">
                <p className="mt-0 mb-1.5 text-sm font-medium text-kumo-default" id="preview-url-label">
                  Preview URL
                </p>
                <div aria-labelledby="preview-url-label" role="group">
                  <ClipboardText text={previewHost} size="base" labels={{ copyAction: "Copy preview URL" }} />
                </div>
              </div>
              <div className="flex justify-between gap-2">
                <Button variant="secondary" onClick={() => goTo(0)}>
                  <ArrowLeftIcon size={16} aria-hidden="true" />
                  Back
                </Button>
                <Button type="submit" variant="primary">
                  Next
                  <ArrowRightIcon size={16} aria-hidden="true" />
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <Text variant="heading" as="h2">
                <span ref={headingRef} tabIndex={-1} className="outline-none">
                  Step 3: Review and deploy
                </span>
              </Text>
              <DetailList
                items={[
                  { label: "Template", value: chosen.label },
                  { label: "Type", value: chosen.kind },
                  { label: "Name", value: <span className="font-mono">{name}</span> },
                  { label: "URL", value: <span className="font-mono break-all">https://{previewHost}</span> },
                  { label: "Account", value: account.name },
                ]}
              />
              <div className="flex justify-between gap-2">
                <Button variant="secondary" onClick={() => goTo(1)} disabled={deploying}>
                  <ArrowLeftIcon size={16} aria-hidden="true" />
                  Back
                </Button>
                <Button variant="primary" className="rounded-full" icon={RocketLaunchIcon} loading={deploying} onClick={deploy}>
                  {deploying ? "Deploying…" : "Deploy"}
                </Button>
              </div>
            </div>
          )}
        </LayerCard.Primary>
      </LayerCard>
    </>
  );
}
