import { Fragment } from "react";
import { Breadcrumbs, Button, DropdownMenu, useSidebar } from "@cloudflare/kumo";
import {
  BuildingsIcon,
  CaretUpDownIcon,
  DesktopIcon,
  ListIcon,
  MoonIcon,
  SignOutIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { useStore } from "../lib/store.tsx";
import { useRouter } from "../lib/router.tsx";
import { useTheme, type ThemeChoice } from "../lib/theme.tsx";
import { useToast } from "../lib/toast.ts";
import { CURRENT_USER } from "../data/seed.ts";
import { CommandMenu } from "./CommandMenu.tsx";

export interface Crumb {
  label: string;
  href?: string;
}

function MobileMenuButton() {
  const { isMobile, toggleSidebar } = useSidebar();
  if (!isMobile) return null;
  return <Button variant="ghost" shape="square" icon={ListIcon} aria-label="Open navigation" onClick={toggleSidebar} />;
}

function AccountSwitcher() {
  const { state, account, dispatch } = useStore();
  const { location, navigate } = useRouter();
  const toast = useToast();

  const switchTo = (id: string) => {
    if (id === account.id) return;
    const target = state.accounts.find((a) => a.id === id);
    dispatch({ type: "switch-account", accountId: id });
    // Detail pages belong to the old account; fall back to its list page.
    const [, section, item] = location.pathname.split("/");
    if (item && (section === "domains" || section === "workers")) navigate(`/${section}`);
    if (target) toast(`Switched to ${target.name}`, { variant: "info" });
  };

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        render={
          <Button variant="ghost" icon={BuildingsIcon} aria-label={`Account: ${account.name}. Switch account`} className="max-w-56">
            <span className="hidden truncate md:inline">{account.name}</span>
            <CaretUpDownIcon size={14} aria-hidden="true" className="hidden text-kumo-subtle md:inline" />
          </Button>
        }
      />
      <DropdownMenu.Content align="end">
        <DropdownMenu.Group>
          <DropdownMenu.Label>Accounts</DropdownMenu.Label>
          {state.accounts.map((a) => (
            <DropdownMenu.Item key={a.id} icon={BuildingsIcon} selected={a.id === account.id} onClick={() => switchTo(a.id)}>
              {a.name}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

const THEME_OPTIONS: Array<{ value: ThemeChoice; label: string; icon: typeof SunIcon }> = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: DesktopIcon },
];

function ThemeSwitch() {
  const { choice, mode, setChoice } = useTheme();
  const CurrentIcon = choice === "system" ? DesktopIcon : mode === "dark" ? MoonIcon : SunIcon;
  const label = THEME_OPTIONS.find((o) => o.value === choice)?.label ?? "System";
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        render={<Button variant="ghost" shape="square" icon={CurrentIcon} aria-label={`Theme: ${label}. Change theme`} />}
      />
      <DropdownMenu.Content align="end">
        <DropdownMenu.Group>
          <DropdownMenu.Label>Theme</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={choice} onValueChange={(v: ThemeChoice) => setChoice(v)}>
            {THEME_OPTIONS.map((o) => (
              <DropdownMenu.RadioItem key={o.value} value={o.value} icon={o.icon} closeOnClick>
                {o.label}
                <DropdownMenu.RadioItemIndicator />
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

function UserMenu() {
  const toast = useToast();
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        render={
          <button
            type="button"
            aria-label={`User menu for ${CURRENT_USER.name}`}
            className="flex size-9 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-kumo-focus"
          />
        }
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-kumo-contrast text-xs font-semibold text-kumo-inverse"
        >
          {CURRENT_USER.initials}
        </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Group>
          <DropdownMenu.Label>
            <span className="block text-sm font-medium text-kumo-default">{CURRENT_USER.name}</span>
            <span className="block text-xs text-kumo-subtle">{CURRENT_USER.email}</span>
          </DropdownMenu.Label>
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.LinkItem href="/settings" icon={UserIcon}>
          Profile
        </DropdownMenu.LinkItem>
        <DropdownMenu.LinkItem href="/settings/members" icon={UsersIcon}>
          Members
        </DropdownMenu.LinkItem>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          icon={SignOutIcon}
          onClick={() => toast("Sign-out is disabled in this demo", { variant: "info" })}
        >
          Sign out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

export function TopBar({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-kumo-hairline bg-kumo-base px-3 sm:px-4">
      <MobileMenuButton />
      <div className="min-w-0 flex-1 overflow-hidden">
        <Breadcrumbs size="sm">
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1;
            return (
              <Fragment key={`${crumb.label}-${i}`}>
                {last || !crumb.href ? (
                  <Breadcrumbs.Current>{crumb.label}</Breadcrumbs.Current>
                ) : (
                  <span className="hidden items-center sm:inline-flex">
                    <Breadcrumbs.Link href={crumb.href}>{crumb.label}</Breadcrumbs.Link>
                  </span>
                )}
                {!last && (
                  <span className="hidden sm:inline-flex">
                    <Breadcrumbs.Separator />
                  </span>
                )}
              </Fragment>
            );
          })}
        </Breadcrumbs>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <CommandMenu />
        <AccountSwitcher />
        <ThemeSwitch />
        <UserMenu />
      </div>
    </div>
  );
}
