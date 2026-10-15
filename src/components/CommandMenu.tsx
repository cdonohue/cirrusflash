import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button, CommandPalette } from "@cloudflare/kumo";
import {
  ChartLineIcon,
  CodeIcon,
  GearSixIcon,
  GlobeHemisphereWestIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { useStore } from "../lib/store.tsx";
import { useNavigate } from "../lib/router.tsx";

interface CommandItem {
  id: string;
  title: string;
  hint?: string;
  href: string;
  icon: ReactNode;
}

interface CommandGroup {
  id: string;
  label: string;
  items: CommandItem[];
}

const icon = (Icon: typeof HouseIcon) => <Icon size={16} aria-hidden="true" />;

export function CommandMenu() {
  const { account } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMac = useMemo(() => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups = useMemo<CommandGroup[]>(() => {
    const pages: CommandItem[] = [
      { id: "p-home", title: "Account home", href: "/", icon: icon(HouseIcon) },
      { id: "p-domains", title: "Domains", href: "/domains", icon: icon(GlobeHemisphereWestIcon) },
      { id: "p-workers", title: "Workers & Pages", href: "/workers", icon: icon(CodeIcon) },
      { id: "p-create", title: "Create application", href: "/workers/create", icon: icon(CodeIcon) },
      { id: "p-analytics", title: "Analytics", href: "/analytics", icon: icon(ChartLineIcon) },
      { id: "p-members", title: "Members", href: "/settings/members", icon: icon(UsersIcon) },
      { id: "p-settings", title: "Settings", href: "/settings", icon: icon(GearSixIcon) },
    ];
    const domains = account.domains.map((d) => ({
      id: `d-${d.name}`,
      title: d.name,
      hint: "Domain",
      href: `/domains/${d.name}`,
      icon: icon(GlobeHemisphereWestIcon),
    }));
    const workers = account.workers.map((w) => ({
      id: `w-${w.name}`,
      title: w.name,
      hint: w.type === "pages" ? "Pages" : "Worker",
      href: `/workers/${w.name}`,
      icon: icon(CodeIcon),
    }));
    const q = search.trim().toLowerCase();
    return [
      { id: "pages", label: "Pages", items: pages },
      { id: "domains", label: "Domains", items: domains },
      { id: "workers", label: "Workers & Pages", items: workers },
    ]
      .map((g) => ({ ...g, items: q ? g.items.filter((i) => i.title.toLowerCase().includes(q)) : g.items }))
      .filter((g) => g.items.length > 0);
  }, [account, search]);

  const go = (item: CommandItem) => {
    setOpen(false);
    setSearch("");
    navigate(item.href);
  };

  return (
    <>
      <Button
        variant="secondary"
        icon={MagnifyingGlassIcon}
        onClick={() => setOpen(true)}
        aria-label="Search pages, domains and workers"
        aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
        className="sm:w-56 sm:justify-start"
      >
        <span className="hidden flex-1 text-left text-kumo-subtle sm:inline">Search…</span>
        <kbd className="hidden rounded border border-kumo-hairline bg-kumo-base px-1.5 py-0.5 text-xs text-kumo-subtle sm:inline">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </Button>
      <CommandPalette.Root
        open={open}
        onOpenChange={(next: boolean) => {
          setOpen(next);
          if (!next) setSearch("");
        }}
        items={groups}
        value={search}
        onValueChange={setSearch}
        itemToStringValue={(group: CommandGroup) => group.label}
        getSelectableItems={(gs: CommandGroup[]) => gs.flatMap((g) => g.items)}
        onSelect={(item: CommandItem) => go(item)}
      >
        <CommandPalette.Input placeholder="Jump to a page, domain or worker…" aria-label="Search" autoComplete="off" spellCheck={false} />
        <CommandPalette.List>
          <CommandPalette.Results>
            {(group: CommandGroup) => (
              <CommandPalette.Group key={group.id} items={group.items}>
                <CommandPalette.GroupLabel>{group.label}</CommandPalette.GroupLabel>
                <CommandPalette.Items>
                  {(item: CommandItem) => (
                    <CommandPalette.Item key={item.id} value={item} onClick={() => go(item)}>
                      <span className="flex w-full items-center gap-3">
                        <span className="text-kumo-subtle">{item.icon}</span>
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.hint && <span className="text-xs text-kumo-subtle">{item.hint}</span>}
                      </span>
                    </CommandPalette.Item>
                  )}
                </CommandPalette.Items>
              </CommandPalette.Group>
            )}
          </CommandPalette.Results>
          <CommandPalette.Empty>No matching pages, domains or workers</CommandPalette.Empty>
        </CommandPalette.List>
        <CommandPalette.Footer>
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-kumo-hairline bg-kumo-base px-1.5 py-0.5 text-[10px]">↑↓</kbd>
            <span>Navigate</span>
          </span>
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-kumo-hairline bg-kumo-base px-1.5 py-0.5 text-[10px]">↵</kbd>
            <span>Open</span>
          </span>
        </CommandPalette.Footer>
      </CommandPalette.Root>
    </>
  );
}
