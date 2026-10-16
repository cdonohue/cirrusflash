import { useState, type FormEvent } from "react";
import { Badge, Banner, Button, ClipboardText, Dialog, Empty, Input, Meter, Switch, Table, Tabs, Text } from "@cloudflare/kumo";
import { CheckCircleIcon, KeyIcon, PlusIcon, TrashIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import { useStore } from "../lib/store.tsx";
import { useNavigate, useRoute } from "../lib/router.tsx";
import { useTitle } from "../lib/useTitle.ts";
import { useToast } from "../lib/toast.ts";
import { formatNumber } from "../lib/format.ts";
import { validateVariableName } from "../lib/validate.ts";
import type { Worker } from "../data/types.ts";
import { Card, PageHeader, StatTile } from "../components/ui.tsx";
import { NotFoundPage } from "./NotFound.tsx";
import { TEMPLATES } from "./CreateWorker.tsx";

export type WorkerTab = "overview" | "settings";

export function WorkerPage({ name, tab }: { name: string; tab: WorkerTab }) {
  const { account } = useStore();
  const navigate = useNavigate();
  const { state } = useRoute();
  const [showDeployed, setShowDeployed] = useState(true);
  const worker = account.workers.find((w) => w.name === name);
  useTitle(worker && (tab === "overview" ? "Overview" : "Settings"), worker ? worker.name : "Application not found");

  if (!worker) {
    return (
      <NotFoundPage
        title="Application not found"
        description={`${name} is not an application in ${account.name}.`}
        backHref="/workers"
        backLabel="Back to Workers & Pages"
      />
    );
  }

  const deployed = showDeployed && (state as { deployed?: boolean } | null)?.deployed === true;
  const base = `/workers/${worker.name}`;

  return (
    <>
      {deployed && (
        <div className="mb-6" role="status">
          <Banner
            icon={<CheckCircleIcon weight="fill" aria-hidden="true" />}
            title={`Deployed ${worker.name}`}
            description={`Your application is live at https://${worker.name}.stratobeam.example.`}
            action={<Banner.Action variant="ghost" icon={<XIcon aria-hidden="true" />} aria-label="Dismiss" onClick={() => setShowDeployed(false)} />}
          />
        </div>
      )}

      <PageHeader
        title={worker.name}
        meta={<Badge variant={worker.type === "pages" ? "teal" : "blue"}>{worker.type === "pages" ? "Pages" : "Worker"}</Badge>}
        description={`Last deployed ${worker.lastDeployed}. Template: ${TEMPLATES.find((t) => t.value === worker.template)?.label ?? worker.template}.`}
        actions={
          <div className="w-full sm:w-80">
            <ClipboardText text={`${worker.name}.stratobeam.example`} size="base" labels={{ copyAction: "Copy application URL" }} />
          </div>
        }
      />

      <div className="mb-6 overflow-x-auto">
        <Tabs
          variant="underline"
          value={tab}
          onValueChange={(v) => navigate(v === "settings" ? `${base}/settings` : base)}
          tabs={[
            { value: "overview", label: "Overview" },
            { value: "settings", label: "Settings" },
          ]}
        />
      </div>

      {tab === "overview" ? <OverviewTab worker={worker} /> : <SettingsTab worker={worker} />}
    </>
  );
}

function OverviewTab({ worker }: { worker: Worker }) {
  const successRate = worker.requests24h === 0 ? 100 : (1 - worker.errors24h / worker.requests24h) * 100;
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Metrics, last 24 hours
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Requests (24h)" value={formatNumber(worker.requests24h)} />
          <StatTile label="Errors (24h)" value={formatNumber(worker.errors24h)} />
          <StatTile label="Success rate" value={`${successRate.toFixed(2)}%`} />
          <StatTile label="Median CPU time" value={`${worker.cpuMedianMs.toFixed(1)} ms`} />
        </div>
      </section>

      <Card title="CPU limit" description="Median CPU time per request against the 50 ms limit.">
        <Meter label="Median CPU time" value={worker.cpuMedianMs} max={50} customValue={`${worker.cpuMedianMs.toFixed(1)} / 50 ms`} />
      </Card>

      <Card title="Deployments" description="The most recent versions of this application." flush>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Version</Table.Head>
              <Table.Head>Message</Table.Head>
              <Table.Head>Author</Table.Head>
              <Table.Head>Deployed</Table.Head>
              <Table.Head>Status</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {worker.deployments.map((d) => (
              <Table.Row key={d.id}>
                <Table.Cell className="font-mono text-sm">{d.version}</Table.Cell>
                <Table.Cell>{d.message}</Table.Cell>
                <Table.Cell>{d.author}</Table.Cell>
                <Table.Cell className="whitespace-nowrap">{d.deployedAt}</Table.Cell>
                <Table.Cell>
                  {d.status === "active" ? (
                    <Badge variant="success" appearance="dot">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="neutral" appearance="dot">
                      Superseded
                    </Badge>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>
    </div>
  );
}

function SettingsTab({ worker }: { worker: Worker }) {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const deleteWorker = () => {
    if (confirmName !== worker.name) return;
    setDeleteOpen(false);
    dispatch({ type: "delete-worker", name: worker.name });
    toast(`Deleted ${worker.name}`);
    navigate("/workers");
  };

  return (
    <div className="flex flex-col gap-6">
      <Card
        title="Variables and secrets"
        description="Values available to your code as environment bindings."
        actions={
          <Button variant="secondary" icon={PlusIcon} className="h-6 text-xs" onClick={() => setAddOpen(true)}>
            Add variable
          </Button>
        }
        flush
      >
        {worker.variables.length === 0 ? (
          <div className="p-8">
            <Empty
              icon={<KeyIcon size={32} aria-hidden="true" />}
              title="No variables yet"
              description="Add configuration values or secrets your code can read at runtime."
            />
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Name</Table.Head>
                <Table.Head>Value</Table.Head>
                <Table.Head>Type</Table.Head>
                <Table.Head>
                  <span className="sr-only">Actions</span>
                </Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {worker.variables.map((v) => (
                <Table.Row key={v.name}>
                  <Table.Cell className="font-mono text-sm">{v.name}</Table.Cell>
                  <Table.Cell className="font-mono text-sm">
                    {v.secret ? (
                      <span aria-label="Value hidden">••••••••</span>
                    ) : (
                      <span className="break-all">{v.value}</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>{v.secret ? <Badge variant="purple">Secret</Badge> : <Badge variant="neutral">Plain text</Badge>}</Table.Cell>
                  <Table.Cell className="text-right">
                    <Button
                      variant="ghost"
                      shape="square"
                      size="sm"
                      icon={TrashIcon}
                      aria-label={`Remove variable ${v.name}`}
                      onClick={() => {
                        dispatch({ type: "delete-variable", worker: worker.name, name: v.name });
                        toast("Variable removed", { description: v.name });
                      }}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>

      <Card title="Observability">
        <Switch
          label="Logs"
          checked={worker.logs}
          onCheckedChange={(checked) => {
            dispatch({ type: "set-worker-logs", name: worker.name, logs: checked });
            toast(checked ? "Logs enabled" : "Logs disabled");
          }}
        />
        <p className="mt-2 mb-0 text-sm text-kumo-subtle">Keep request logs for 7 days so you can search them later.</p>
      </Card>

      <Card title="Danger zone">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Text bold>Delete this application</Text>
            <Text variant="secondary" size="sm">
              Removes the application, its deployments and its variables. This cannot be undone.
            </Text>
          </div>
          <Button variant="destructive" icon={TrashIcon} className="h-9 px-5" onClick={() => setDeleteOpen(true)}>
            Delete worker
          </Button>
        </div>
      </Card>

      <AddVariableDialog worker={worker} open={addOpen} onOpenChange={setAddOpen} />

      <Dialog.Root
        open={deleteOpen}
        role="alertdialog"
        onOpenChange={(open: boolean) => {
          setDeleteOpen(open);
          if (!open) setConfirmName("");
        }}
      >
        <Dialog size="lg" className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              deleteWorker();
            }}
            noValidate
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-kumo-danger-tint text-kumo-danger">
                <WarningIcon size={20} weight="fill" aria-hidden="true" />
              </span>
              <Dialog.Title className="text-lg font-semibold">Delete {worker.name}?</Dialog.Title>
            </div>
            <Dialog.Description className="mb-5 text-kumo-subtle">
              This permanently deletes the application and stops serving{" "}
              <span className="font-mono text-kumo-default">{worker.name}.stratobeam.example</span>.
            </Dialog.Description>
            <Input
              label={
                <span>
                  Type <span className="font-mono font-semibold">{worker.name}</span> to confirm
                </span>
              }
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="none"
              passwordManagerIgnore
            />
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close render={(props) => <Button {...props} variant="secondary">Cancel</Button>} />
              <Button type="submit" variant="destructive" disabled={confirmName !== worker.name}>
                Delete
              </Button>
            </div>
          </form>
        </Dialog>
      </Dialog.Root>
    </div>
  );
}

function AddVariableDialog({ worker, open, onOpenChange }: { worker: Worker; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [secret, setSecret] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const nameError = validateVariableName(name, worker.variables.map((v) => v.name));
  const valueError = value.trim() ? undefined : "Enter a value.";

  const reset = () => {
    setName("");
    setValue("");
    setSecret(false);
    setSubmitted(false);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (nameError || valueError) return;
    dispatch({ type: "add-variable", worker: worker.name, variable: { name: name.trim(), value, secret } });
    toast(secret ? "Secret added" : "Variable added", { description: name.trim() });
    onOpenChange(false);
    reset();
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
            <Dialog.Title className="text-xl font-semibold">Add variable</Dialog.Title>
            <Dialog.Close render={(props) => <Button {...props} variant="ghost" shape="square" icon={XIcon} aria-label="Close" />} />
          </div>
          <Dialog.Description className="mb-6 text-kumo-subtle">
            Variables are available to {worker.name} on its next request.
          </Dialog.Description>
          <div className="flex flex-col gap-5">
            <Input
              label="Variable name"
              placeholder="API_BASE_URL"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={submitted ? nameError : undefined}
              description="UPPER_SNAKE_CASE: capital letters, digits and underscores."
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="characters"
              passwordManagerIgnore
              className="font-mono"
            />
            <Input
              label="Value"
              placeholder="https://api.acme-robotics.example"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              error={submitted ? valueError : undefined}
              description={secret ? "Secrets are hidden after you save them." : undefined}
              autoComplete="off"
              spellCheck={false}
              passwordManagerIgnore
              className={secret ? "font-mono [-webkit-text-security:disc]" : "font-mono"}
            />
            <Switch label="Encrypt as a secret" checked={secret} onCheckedChange={setSecret} />
          </div>
          <div className="mt-8 flex justify-end gap-2">
            <Dialog.Close render={(props) => <Button {...props} variant="secondary">Cancel</Button>} />
            <Button type="submit" variant="primary">
              Add variable
            </Button>
          </div>
        </form>
      </Dialog>
    </Dialog.Root>
  );
}
