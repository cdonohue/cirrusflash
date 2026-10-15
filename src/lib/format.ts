// Fixed locale so output never depends on the browser running the test.
const integer = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function formatNumber(value: number): string {
  return integer.format(value);
}

export function formatCompact(value: number): string {
  return compact.format(value);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** UTC tick labels: "14:00" for hourly ranges, "Oct 3" for longer ones. */
export function formatTick(ms: number, withTime: boolean): string {
  const d = new Date(ms);
  if (withTime) return `${String(d.getUTCHours()).padStart(2, "0")}:00`;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export const PLAN_LABEL = { free: "Free", pro: "Pro", business: "Business" } as const;
export const ROLE_LABEL = { administrator: "Administrator", developer: "Developer", viewer: "Viewer" } as const;
export const TTL_LABEL = { auto: "Auto", "60": "1 min", "300": "5 min", "3600": "1 hour" } as const;
