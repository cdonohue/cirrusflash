import type { ReactNode } from "react";
import { LinkProvider, Sidebar, Toasty, TooltipProvider } from "@cloudflare/kumo";
import { RouteProvider, RouterLink, RouterProvider, matchPath, useRouter, type Params } from "./lib/router.tsx";
import { ThemeProvider } from "./lib/theme.tsx";
import { StoreProvider, useStore } from "./lib/store.tsx";
import { AppSidebar } from "./components/AppSidebar.tsx";
import { TopBar, type Crumb } from "./components/TopBar.tsx";
import { HomePage } from "./pages/Home.tsx";
import { DomainsPage } from "./pages/Domains.tsx";
import { DomainPage } from "./pages/Domain.tsx";
import { WorkersPage } from "./pages/Workers.tsx";
import { CreateWorkerPage } from "./pages/CreateWorker.tsx";
import { WorkerPage } from "./pages/Worker.tsx";
import { AnalyticsPage } from "./pages/Analytics.tsx";
import { SettingsPage } from "./pages/Settings.tsx";
import { MembersPage } from "./pages/Members.tsx";
import { NotFoundPage } from "./pages/NotFound.tsx";

interface Route {
  pattern: string;
  render: (params: Params) => ReactNode;
  crumbs: (params: Params) => Crumb[];
}

// Order matters: /workers/create must come before /workers/:name.
const ROUTES: Route[] = [
  { pattern: "/", render: () => <HomePage />, crumbs: () => [] },
  { pattern: "/domains", render: () => <DomainsPage />, crumbs: () => [{ label: "Domains" }] },
  {
    pattern: "/domains/:domain",
    render: (p) => <DomainPage key={p.domain} domain={p.domain!} tab="overview" />,
    crumbs: (p) => [{ label: "Domains", href: "/domains" }, { label: p.domain! }],
  },
  {
    pattern: "/domains/:domain/dns",
    render: (p) => <DomainPage key={p.domain} domain={p.domain!} tab="dns" />,
    crumbs: (p) => [{ label: "Domains", href: "/domains" }, { label: p.domain!, href: `/domains/${p.domain}` }, { label: "DNS" }],
  },
  {
    pattern: "/domains/:domain/ssl",
    render: (p) => <DomainPage key={p.domain} domain={p.domain!} tab="ssl" />,
    crumbs: (p) => [{ label: "Domains", href: "/domains" }, { label: p.domain!, href: `/domains/${p.domain}` }, { label: "SSL/TLS" }],
  },
  { pattern: "/workers", render: () => <WorkersPage />, crumbs: () => [{ label: "Workers & Pages" }] },
  {
    pattern: "/workers/create",
    render: () => <CreateWorkerPage />,
    crumbs: () => [{ label: "Workers & Pages", href: "/workers" }, { label: "Create application" }],
  },
  {
    pattern: "/workers/:name",
    render: (p) => <WorkerPage key={p.name} name={p.name!} tab="overview" />,
    crumbs: (p) => [{ label: "Workers & Pages", href: "/workers" }, { label: p.name! }],
  },
  {
    pattern: "/workers/:name/settings",
    render: (p) => <WorkerPage key={p.name} name={p.name!} tab="settings" />,
    crumbs: (p) => [{ label: "Workers & Pages", href: "/workers" }, { label: p.name!, href: `/workers/${p.name}` }, { label: "Settings" }],
  },
  { pattern: "/analytics", render: () => <AnalyticsPage />, crumbs: () => [{ label: "Analytics" }] },
  { pattern: "/settings", render: () => <SettingsPage />, crumbs: () => [{ label: "Settings" }] },
  {
    pattern: "/settings/members",
    render: () => <MembersPage />,
    crumbs: () => [{ label: "Settings", href: "/settings" }, { label: "Members" }],
  },
];

function Shell() {
  const { location } = useRouter();
  const { account } = useStore();

  let match: { route: Route; params: Params } | null = null;
  for (const route of ROUTES) {
    const params = matchPath(route.pattern, location.pathname);
    if (params) {
      match = { route, params };
      break;
    }
  }

  const crumbs: Crumb[] = [
    { label: account.name, href: "/" },
    ...(match ? match.route.crumbs(match.params) : [{ label: "Page not found" }]),
  ];

  return (
    <Sidebar.Provider defaultOpen className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-kumo-base px-3 py-2 text-kumo-default focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:ring-2 focus:ring-kumo-focus"
      >
        Skip to content
      </a>
      <AppSidebar />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col bg-kumo-canvas">
        <TopBar crumbs={crumbs} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
          <RouteProvider
            value={{ pathname: location.pathname, params: match?.params ?? {}, pattern: match?.route.pattern ?? null }}
          >
            {match ? match.route.render(match.params) : <NotFoundPage />}
          </RouteProvider>
        </main>
        <footer className="border-t border-kumo-hairline px-4 py-4 text-center text-xs text-kumo-subtle sm:px-6">
          Stratobeam is a fictional product. This is a demo for Exhibit.
        </footer>
      </div>
    </Sidebar.Provider>
  );
}

export function App() {
  return (
    <RouterProvider>
      <ThemeProvider>
        <StoreProvider>
          <LinkProvider component={RouterLink}>
            <TooltipProvider>
              <Toasty>
                <Shell />
              </Toasty>
            </TooltipProvider>
          </LinkProvider>
        </StoreProvider>
      </ThemeProvider>
    </RouterProvider>
  );
}
