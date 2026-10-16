import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "./router.tsx";

/*
 * Kumo switches every token with `data-mode="dark"` on an ancestor (its CSS
 * uses light-dark() plus `[data-mode="dark"] { color-scheme: dark }`). We set
 * it on <html>, first from the inline script in index.html and then here.
 *
 * Precedence: `?theme=light|dark` in the URL, then the saved choice, then the
 * operating system preference.
 */

export type ThemeChoice = "light" | "dark" | "system";
export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "stratobeam:theme";

function readSaved(): ThemeChoice {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
  return "system";
}

function writeSaved(choice: ThemeChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Not fatal: the choice still applies for this page load.
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;
}

interface ThemeValue {
  /** What the user picked (or what the URL forces). */
  choice: ThemeChoice;
  /** What is actually applied. */
  mode: ThemeMode;
  /** True while `?theme=` in the URL is in control. */
  forcedByUrl: boolean;
  setChoice: (choice: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { location, navigate } = useRouter();
  const [saved, setSaved] = useState<ThemeChoice>(readSaved);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const onChange = () => setSystemDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const urlParam = new URLSearchParams(location.search).get("theme");
  const forced: ThemeMode | null = urlParam === "light" || urlParam === "dark" ? urlParam : null;
  const choice: ThemeChoice = forced ?? saved;
  const mode: ThemeMode = choice === "system" ? (systemDark ? "dark" : "light") : choice;

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);

  const setChoice = useCallback(
    (next: ThemeChoice) => {
      setSaved(next);
      writeSaved(next);
      // If the URL is forcing a mode, rewrite it so the visible choice wins
      // and stays sticky across navigation.
      const url = new URL(window.location.href);
      if (url.searchParams.has("theme")) {
        if (next === "system") url.searchParams.delete("theme");
        else url.searchParams.set("theme", next);
        navigate(url.pathname + url.search + url.hash, { replace: true, exact: true, state: window.history.state });
      }
    },
    [navigate],
  );

  const value = useMemo(
    () => ({ choice, mode, forcedByUrl: forced !== null, setChoice }),
    [choice, mode, forced, setChoice],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside <ThemeProvider>");
  return value;
}
