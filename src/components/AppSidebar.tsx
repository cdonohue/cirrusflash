import { useEffect } from "react";
import { Sidebar, useSidebar } from "@cloudflare/kumo";
import {
  ChartLineIcon,
  CodeIcon,
  GearSixIcon,
  GlobeHemisphereWestIcon,
  HouseIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { useRouter } from "../lib/router.tsx";
import { Brand } from "./Brand.tsx";

function SidebarBrand() {
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  return (
    <a
      href="/"
      className="flex min-h-9 items-center rounded-lg px-1 outline-none focus-visible:ring-2 focus-visible:ring-kumo-focus"
      aria-label="Stratobeam account home"
    >
      <Brand compact={collapsed} />
    </a>
  );
}

/** Closes the mobile sheet after each navigation. */
function CloseOnNavigate({ pathname }: { pathname: string }) {
  const { isMobile, setOpenMobile } = useSidebar();
  useEffect(() => {
    if (!isMobile) return;
    setOpenMobile(false);
    // The sheet becomes aria-hidden as it closes; move focus out of it so it
    // is not left on a hidden link.
    document.getElementById("main")?.focus({ preventScroll: true });
    // Only on route change; isMobile flips should not close an open sheet.
  }, [pathname]);
  return null;
}

export function AppSidebar() {
  const { location } = useRouter();
  const path = location.pathname;
  const is = (prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

  return (
    // Sticky and viewport-tall so the page itself scrolls (full-page screenshots
    // then capture everything) while the navigation stays in view. Desktop
    // only: below md Kumo renders this as a fixed mobile sheet.
    <Sidebar aria-label="Main navigation" className="md:sticky md:top-0 md:h-dvh md:self-start">
      <CloseOnNavigate pathname={path} />
      <Sidebar.Header>
        <SidebarBrand />
      </Sidebar.Header>
      <Sidebar.Content className="flex flex-col">
        <Sidebar.Group>
          <Sidebar.Menu>
            <Sidebar.MenuButton href="/" icon={HouseIcon} tooltip="Account home" active={path === "/"}>
              Account home
            </Sidebar.MenuButton>
            <Sidebar.MenuButton href="/domains" icon={GlobeHemisphereWestIcon} tooltip="Domains" active={is("/domains")}>
              Domains
            </Sidebar.MenuButton>
          </Sidebar.Menu>
        </Sidebar.Group>
        {/* A labelled group rather than Sidebar.MenuSub: MenuSub renders a
            decorative <div> inside its <ul>, which axe reports as an invalid list. */}
        <Sidebar.Group>
          <Sidebar.GroupLabel>Compute</Sidebar.GroupLabel>
          <Sidebar.Menu>
            <Sidebar.MenuButton href="/workers" icon={CodeIcon} tooltip="Workers & Pages" active={is("/workers")}>
              Workers &amp; Pages
            </Sidebar.MenuButton>
          </Sidebar.Menu>
        </Sidebar.Group>
        <Sidebar.Group>
          <Sidebar.GroupLabel>Analytics &amp; logs</Sidebar.GroupLabel>
          <Sidebar.Menu>
            <Sidebar.MenuButton href="/analytics" icon={ChartLineIcon} tooltip="Analytics" active={is("/analytics")}>
              Analytics
            </Sidebar.MenuButton>
          </Sidebar.Menu>
        </Sidebar.Group>
        <Sidebar.Group className="mt-auto">
          <Sidebar.GroupLabel>Manage account</Sidebar.GroupLabel>
          <Sidebar.Menu>
            <Sidebar.MenuButton href="/settings/members" icon={UsersIcon} tooltip="Members" active={is("/settings/members")}>
              Members
            </Sidebar.MenuButton>
            <Sidebar.MenuButton href="/settings" icon={GearSixIcon} tooltip="Settings" active={path === "/settings"}>
              Settings
            </Sidebar.MenuButton>
          </Sidebar.Menu>
        </Sidebar.Group>
      </Sidebar.Content>
      <Sidebar.Footer>
        <Sidebar.Trigger />
      </Sidebar.Footer>
    </Sidebar>
  );
}
