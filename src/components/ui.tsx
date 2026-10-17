import type { ReactNode } from "react";
import { LayerCard, Text, cn } from "@cloudflare/kumo";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react";

export function PageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Text variant="heading" size="lg" as="h1">
            {title}
          </Text>
          {meta}
        </div>
        {description && (
          <div className="mt-1 max-w-2xl">
            <Text variant="secondary">{description}</Text>
          </div>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/**
 * A titled card. `flush` removes body padding and makes the body a
 * horizontally scrollable, keyboard-focusable region for wide tables.
 */
export function Card({
  title,
  description,
  actions,
  children,
  flush = false,
  label,
  className,
  headingLevel = "h2",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  /** Accessible name for a flush card's scroll region; defaults to a string title. */
  label?: string;
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  const regionLabel = label ?? (typeof title === "string" ? title : undefined);
  return (
    <LayerCard className={cn("min-w-0", className)}>
      {title && (
        <LayerCard.Secondary className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <Text variant="heading" as={headingLevel}>
              {title}
            </Text>
            {description && (
              <Text variant="secondary" size="sm">
                {description}
              </Text>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </LayerCard.Secondary>
      )}
      <LayerCard.Primary className={cn(flush ? "p-0" : "p-4 sm:p-5")}>
        {flush ? (
          <div
            role="region"
            aria-label={regionLabel}
            tabIndex={0}
            className="overflow-x-auto rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-kumo-focus focus-visible:ring-inset"
          >
            {children}
          </div>
        ) : (
          children
        )}
      </LayerCard.Primary>
    </LayerCard>
  );
}

export function StatTile({
  label,
  value,
  trend,
  trendLabel = "vs. previous 24h",
  goodWhenUp = true,
}: {
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  goodWhenUp?: boolean;
}) {
  const up = (trend ?? 0) >= 0;
  const good = up === goodWhenUp;
  const TrendIcon = up ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <LayerCard className="min-w-0">
      <LayerCard.Primary className="flex flex-col gap-1 p-4">
        <Text variant="secondary" size="sm" as="p">
          {label}
        </Text>
        <p className="tabular text-2xl font-semibold text-kumo-default">{value}</p>
        {trend !== undefined && (
          <p className="flex items-center gap-1 text-sm">
            <span className={cn("flex items-center gap-0.5 font-medium", good ? "text-kumo-success" : "text-kumo-danger")}>
              <TrendIcon size={14} weight="bold" aria-hidden="true" />
              <span className="tabular">
                {up ? "+" : "−"}
                {Math.abs(trend).toFixed(1)}%
              </span>
            </span>
            <span className="text-kumo-subtle">{trendLabel}</span>
          </p>
        )}
      </LayerCard.Primary>
    </LayerCard>
  );
}

/** Label/value rows for summaries. `compact` suits narrow side cards. */
export function DetailList({
  items,
  compact = false,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <dl className="m-0 flex flex-col divide-y divide-kumo-hairline">
        {items.map((item) => (
          <div key={item.label} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0">
            <dt className="text-sm text-kumo-subtle">{item.label}</dt>
            <dd className="m-0 min-w-0 text-sm text-kumo-default">{item.value}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-[minmax(8rem,auto)_minmax(0,1fr)] sm:gap-y-3">
      {items.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-sm text-kumo-subtle">{item.label}</dt>
          <dd className="m-0 mb-2 min-w-0 text-sm text-kumo-default sm:mb-0">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
