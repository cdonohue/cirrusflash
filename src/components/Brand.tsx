import { Badge } from "@cloudflare/kumo";

/**
 * Stratobeam mark: three stacked cloud bands with a small flash. Original
 * artwork for a fictional brand; colours come from Kumo tokens so it adapts
 * to light and dark mode.
 */
export function StratobeamMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" className="shrink-0">
      <rect x="0" y="0" width="32" height="32" rx="8" fill="var(--color-kumo-contrast)" />
      <rect x="5" y="20" width="22" height="5" rx="2.5" fill="var(--color-kumo-info)" opacity="0.55" />
      <rect x="7.5" y="14" width="16" height="5" rx="2.5" fill="var(--color-kumo-info)" opacity="0.8" />
      <rect x="10.5" y="8" width="9" height="5" rx="2.5" fill="var(--color-kumo-info)" />
      <path
        d="M24.5 5.5 L25.6 8.4 L28.5 9.5 L25.6 10.6 L24.5 13.5 L23.4 10.6 L20.5 9.5 L23.4 8.4 Z"
        fill="var(--color-kumo-warning)"
      />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <StratobeamMark />
      {!compact && (
        <>
          <span className="truncate text-base font-semibold tracking-tight text-kumo-default">Stratobeam</span>
          <Badge variant="outline" className="shrink-0">
            Demo
          </Badge>
        </>
      )}
    </span>
  );
}
