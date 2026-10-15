import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LinkComponentProps } from "@cloudflare/kumo";

/*
 * A deliberately small router: history API, one level of params, and a
 * document-wide click handler so any same-origin <a> (ours, Kumo's, or one in
 * a portal) navigates without a reload.
 *
 * The `theme` query parameter is sticky: it rides along on every in-app
 * navigation so an automated browser that opened `?theme=dark` stays in dark
 * mode for the whole session.
 */

export const STICKY_PARAMS = ["theme"] as const;

export interface RouterLocation {
  pathname: string;
  search: string;
  state: unknown;
}

interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
  /** Skip adding sticky params (used when deliberately removing one). */
  exact?: boolean;
}

interface RouterValue {
  location: RouterLocation;
  navigate: (to: string, options?: NavigateOptions) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

function readLocation(): RouterLocation {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    state: window.history.state,
  };
}

/** Adds the sticky params from the current URL to `to` when it lacks them. */
export function withStickyParams(to: string, currentSearch = window.location.search): string {
  const url = new URL(to, window.location.origin);
  if (url.origin !== window.location.origin) return to;
  const current = new URLSearchParams(currentSearch);
  for (const key of STICKY_PARAMS) {
    const value = current.get(key);
    if (value !== null && !url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  return url.pathname + url.search + url.hash;
}

let navigateRef: RouterValue["navigate"] | null = null;

/** Navigate from outside React (e.g. the command palette's onSelect). */
export function navigate(to: string, options?: NavigateOptions) {
  navigateRef?.(to, options);
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<RouterLocation>(readLocation);

  const nav = useCallback((to: string, options: NavigateOptions = {}) => {
    const target = options.exact ? to : withStickyParams(to);
    const current = window.location.pathname + window.location.search + window.location.hash;
    if (options.replace || target === current) {
      window.history.replaceState(options.state ?? null, "", target);
    } else {
      window.history.pushState(options.state ?? null, "", target);
      window.scrollTo(0, 0);
    }
    setLocation(readLocation());
  }, []);

  useEffect(() => {
    navigateRef = nav;
    const onPop = () => setLocation(readLocation());
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || !anchor.hasAttribute("href")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download") || anchor.getAttribute("rel")?.includes("external")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same-page hash links keep native behaviour.
      if (url.pathname === window.location.pathname && url.hash && url.search === window.location.search) return;
      event.preventDefault();
      nav(url.pathname + url.search + url.hash);
    };
    window.addEventListener("popstate", onPop);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onClick);
      navigateRef = null;
    };
  }, [nav]);

  const value = useMemo(() => ({ location, navigate: nav }), [location, nav]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const value = useContext(RouterContext);
  if (!value) throw new Error("useRouter must be used inside <RouterProvider>");
  return value;
}

export function useNavigate() {
  return useRouter().navigate;
}

/* ---------- Route matching ---------- */

export type Params = Record<string, string>;

/** Matches "/domains/:domain/dns" against a pathname. Returns params or null. */
export function matchPath(pattern: string, pathname: string): Params | null {
  const clean = (p: string) => p.replace(/\/+$/, "") || "/";
  const patternParts = clean(pattern).split("/");
  const pathParts = clean(pathname).split("/");
  if (patternParts.length !== pathParts.length) return null;
  const params: Params = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pat = patternParts[i]!;
    const part = pathParts[i]!;
    if (pat.startsWith(":")) {
      if (!part) return null;
      try {
        params[pat.slice(1)] = decodeURIComponent(part);
      } catch {
        return null;
      }
    } else if (pat !== part) {
      return null;
    }
  }
  return params;
}

interface RouteValue {
  pathname: string;
  params: Params;
  pattern: string | null;
}

const RouteContext = createContext<RouteValue>({ pathname: "/", params: {}, pattern: null });

export function RouteProvider({ value, children }: { value: RouteValue; children: ReactNode }) {
  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

/** The current pathname plus the params of the route that matched it. */
export function useRoute(): RouteValue & { search: URLSearchParams; state: unknown } {
  const route = useContext(RouteContext);
  const { location } = useRouter();
  const search = useMemo(() => new URLSearchParams(location.search), [location.search]);
  return { ...route, search, state: location.state };
}

/* ---------- Link component for Kumo's LinkProvider ---------- */

/**
 * Renders a plain anchor whose href already carries the sticky params, so
 * "open in new tab" keeps the theme too. The document click handler above
 * turns ordinary clicks into client-side navigations.
 */
export const RouterLink = forwardRef<HTMLAnchorElement, LinkComponentProps>(function RouterLink(
  { href, to, ...rest },
  ref,
) {
  const { location } = useRouter();
  const target = href ?? to ?? "";
  const resolved = target.startsWith("/") ? withStickyParams(target, location.search) : target;
  return <a ref={ref} href={resolved} {...rest} />;
});
