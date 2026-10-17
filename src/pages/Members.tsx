import { useState, type FormEvent } from "react";
import { Badge, Button, Dialog, Input, Select, Table } from "@cloudflare/kumo";
import { UserPlusIcon, XIcon } from "@phosphor-icons/react";
import { useStore } from "../lib/store.tsx";
import { useTitle } from "../lib/useTitle.ts";
import { useToast } from "../lib/toast.ts";
import { ROLE_LABEL } from "../lib/format.ts";
import { validateEmail } from "../lib/validate.ts";
import type { Role } from "../data/types.ts";
import { Card, PageHeader } from "../components/ui.tsx";
import { RoleBadge } from "../components/badges.tsx";

export function MembersPage() {
  const { account } = useStore();
  const [inviteOpen, setInviteOpen] = useState(false);
  useTitle("Members", account.name);

  return (
    <>
      <PageHeader
        title="Members"
        description={`People who can sign in to ${account.name} and what they are allowed to do.`}
        actions={
          <Button variant="primary" icon={UserPlusIcon} onClick={() => setInviteOpen(true)}>
            Invite a member
          </Button>
        }
      />
      <Card flush label="Members">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Name</Table.Head>
              <Table.Head>Email</Table.Head>
              <Table.Head>Role</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Last seen</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {account.members.map((m) => (
              <Table.Row key={m.email}>
                <Table.Cell className="font-medium">{m.name}</Table.Cell>
                <Table.Cell>
                  <span className="break-all">{m.email}</span>
                </Table.Cell>
                <Table.Cell>
                  <RoleBadge role={m.role} />
                </Table.Cell>
                <Table.Cell>
                  {m.status === "active" ? (
                    <Badge variant="success" appearance="dot">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="warning" appearance="dot">
                      Invited
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">{m.lastSeen}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
}

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { account, dispatch } = useStore();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("developer");
  const [submitted, setSubmitted] = useState(false);

  const existing = account.members.map((m) => m.email.toLowerCase());
  const error = submitted ? validateEmail(email, existing) : undefined;

  const reset = () => {
    setEmail("");
    setRole("developer");
    setSubmitted(false);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (validateEmail(email, existing)) return;
    const address = email.trim().toLowerCase();
    dispatch({ type: "invite-member", email: address, role });
    toast("Invitation sent", { description: `${address} was invited as ${ROLE_LABEL[role]}.` });
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
            <Dialog.Title className="text-xl font-semibold">Invite member</Dialog.Title>
            <Dialog.Close render={(props) => <Button {...props} variant="ghost" shape="square" icon={XIcon} aria-label="Close" />} />
          </div>
          <Dialog.Description className="mb-6 text-kumo-subtle">
            They will get an invitation to join {account.name}. In this demo no email is sent.
          </Dialog.Description>
          <div className="flex flex-col gap-5">
            <Input
              label="Email address"
              type="email"
              placeholder="name@acme-robotics.example"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="none"
              passwordManagerIgnore
            />
            <Select
              label="Role"
              className="w-full"
              value={role}
              onValueChange={(v) => setRole((v as Role | null) ?? "developer")}
              items={ROLE_LABEL}
              description="Administrators can manage members and billing. Viewers have read-only access."
            />
          </div>
          <div className="mt-8 flex justify-end gap-2">
            <Dialog.Close render={(props) => <Button {...props} variant="secondary">Cancel</Button>} />
            <Button type="submit" variant="primary">
              Send invitation
            </Button>
          </div>
        </form>
      </Dialog>
    </Dialog.Root>
  );
}
