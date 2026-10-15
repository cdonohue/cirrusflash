import { useState, type FormEvent } from "react";
import { Button, ClipboardText, Input, Link, Radio, Text } from "@cloudflare/kumo";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useStore } from "../lib/store.tsx";
import { useTheme, type ThemeChoice } from "../lib/theme.tsx";
import { useTitle } from "../lib/useTitle.ts";
import { useToast } from "../lib/toast.ts";
import { validateRequired } from "../lib/validate.ts";
import { Card, PageHeader } from "../components/ui.tsx";

export function SettingsPage() {
  const { account } = useStore();
  useTitle("Settings", account.name);

  return (
    <>
      <PageHeader title="Settings" description="Preferences for you and for this account." />
      <div className="flex flex-col gap-6">
        <AppearanceCard />
        {/* Remount when the account changes so the field shows its name. */}
        <AccountNameCard key={account.id} />
        <Card title="Account ID" description="Use this ID when you contact support or call the API.">
          <div className="max-w-md">
            <ClipboardText text={account.accountTag} size="base" labels={{ copyAction: "Copy account ID" }} />
          </div>
        </Card>
        <Card title="Members">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Text variant="secondary">
              {account.members.length} people can access {account.name}. Invite teammates and manage their roles.
            </Text>
            <Link href="/settings/members" className="inline-flex items-center gap-1 font-medium">
              Manage members <ArrowRightIcon size={14} aria-hidden="true" />
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}

function AppearanceCard() {
  const { choice, setChoice, forcedByUrl } = useTheme();
  return (
    <Card title="Appearance" description="Applies to this browser right away.">
      <Radio.Group
        legend="Theme"
        orientation="horizontal"
        value={choice}
        onValueChange={(v) => setChoice(v as ThemeChoice)}
        description={forcedByUrl ? "The theme was set by the page address. Choosing one here replaces it." : undefined}
      >
        <Radio.Item value="light" label="Light" />
        <Radio.Item value="dark" label="Dark" />
        <Radio.Item value="system" label="System" />
      </Radio.Group>
    </Card>
  );
}

function AccountNameCard() {
  const { account, dispatch } = useStore();
  const toast = useToast();
  const [name, setName] = useState(account.name);
  const [submitted, setSubmitted] = useState(false);
  const error = submitted ? validateRequired(name, "Enter an account name.") : undefined;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (validateRequired(name, "x")) return;
    dispatch({ type: "rename-account", name: name.trim() });
    setSubmitted(false);
    toast("Account name saved", { description: name.trim() });
  };

  return (
    <Card title="Account name" description="Shown in the account switcher and on invoices.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="w-full max-w-md">
          <Input
            label="Account name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
            autoComplete="organization"
            passwordManagerIgnore
          />
        </div>
        <Button type="submit" variant="primary" className="sm:mt-6">
          Save
        </Button>
      </form>
    </Card>
  );
}
