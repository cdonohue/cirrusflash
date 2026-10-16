import type { Account, DnsRecord, Domain, DomainStatus, Plan, Worker } from "./types.ts";

/*
 * Every value here is fixed. No Math.random, no Date.now: the app must render
 * byte-identical pages on every load so before/after screenshots compare.
 */

export const DEMO_NOW = "Oct 9, 2026 14:05 UTC";

const NAMESERVER_NAMES = ["ada", "bert", "cleo", "dax", "enzo", "faye", "gus", "hana"];

/** Deterministic string hash (FNV-1a), used to pick stable fake values. */
export function stableHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function nameserversFor(domain: string): [string, string] {
  const h = stableHash(domain);
  const first = NAMESERVER_NAMES[h % NAMESERVER_NAMES.length]!;
  let second = NAMESERVER_NAMES[(h >>> 8) % NAMESERVER_NAMES.length]!;
  if (second === first) second = NAMESERVER_NAMES[(NAMESERVER_NAMES.indexOf(first) + 3) % NAMESERVER_NAMES.length]!;
  return [`${first}.ns.stratobeam.example`, `${second}.ns.stratobeam.example`];
}

function rec(
  id: string,
  type: DnsRecord["type"],
  name: string,
  content: string,
  proxied: boolean,
  ttl: DnsRecord["ttl"] = "auto",
  priority?: number,
): DnsRecord {
  return priority === undefined
    ? { id, type, name, content, proxied, ttl }
    : { id, type, name, content, proxied, ttl, priority };
}

/** A small, plausible record set for domains without a hand-written one. */
function defaultRecords(domain: string, prefix: string): DnsRecord[] {
  const h = stableHash(domain);
  const octet = 10 + (h % 200);
  return [
    rec(`${prefix}-1`, "A", "@", `192.0.2.${octet}`, true),
    rec(`${prefix}-2`, "CNAME", "www", domain, true),
    rec(`${prefix}-3`, "MX", "@", `mail.${domain}`, false, "3600", 10),
    rec(`${prefix}-4`, "TXT", "@", "v=spf1 include:_spf.mail.example ~all", false, "3600"),
  ];
}

function domain(
  name: string,
  status: DomainStatus,
  plan: Plan,
  requests24h: number,
  addedOn: string,
  records?: DnsRecord[],
): Domain {
  return {
    name,
    status,
    plan,
    requests24h,
    addedOn,
    nameservers: nameserversFor(name),
    records: records ?? defaultRecords(name, name.replace(/[^a-z0-9]/g, "")),
    ssl: { mode: status === "active" ? "full" : "flexible", alwaysHttps: status === "active" },
  };
}

const acmeRoboticsRecords: DnsRecord[] = [
  rec("ar-1", "A", "@", "192.0.2.10", true),
  rec("ar-2", "AAAA", "@", "2001:db8::10", true),
  rec("ar-3", "CNAME", "www", "acme-robotics.example", true),
  rec("ar-4", "A", "api", "192.0.2.24", true),
  rec("ar-5", "CNAME", "shop", "storefront.shops.example", true),
  rec("ar-6", "CNAME", "status", "status.acme.test", false, "300"),
  rec("ar-7", "MX", "@", "mail.acme-robotics.example", false, "3600", 10),
  rec("ar-8", "MX", "@", "mail2.acme-robotics.example", false, "3600", 20),
  rec("ar-9", "TXT", "@", "v=spf1 include:_spf.mail.example ~all", false, "3600"),
  rec("ar-10", "TXT", "_dmarc", "v=DMARC1; p=quarantine; rua=mailto:dmarc@acme-robotics.example", false, "3600"),
];

function workers(prefix: string, list: Array<Omit<Worker, "deployments" | "variables" | "logs"> & Partial<Worker>>): Worker[] {
  return list.map((w, i) => ({
    logs: w.logs ?? i % 2 === 0,
    variables: w.variables ?? [
      { name: "ENVIRONMENT", value: "production", secret: false },
      { name: "API_TOKEN", value: "demo-not-a-real-token", secret: true },
    ],
    deployments: w.deployments ?? [
      {
        id: `${prefix}-${i}-3`,
        version: `v${12 + i}`,
        message: "Tune cache headers for static assets",
        author: "Dana Park",
        deployedAt: w.lastDeployed,
        status: "active",
      },
      {
        id: `${prefix}-${i}-2`,
        version: `v${11 + i}`,
        message: "Add request logging",
        author: "Luis Moreno",
        deployedAt: "Sep 28, 2026 09:12 UTC",
        status: "superseded",
      },
      {
        id: `${prefix}-${i}-1`,
        version: `v${10 + i}`,
        message: "Initial production release",
        author: "Priya Raman",
        deployedAt: "Sep 14, 2026 16:40 UTC",
        status: "superseded",
      },
    ],
    ...w,
  }));
}

export const SEED_ACCOUNTS: Account[] = [
  {
    id: "acme-robotics",
    name: "Acme Robotics",
    accountTag: "4f1c9a27e2b84d0b9c33a1d5e6f70812",
    domains: [
      domain("acme-robotics.example", "active", "business", 2_481_204, "Mar 3, 2025", acmeRoboticsRecords),
      domain("shop.acme-robotics.example", "active", "pro", 1_102_377, "Jun 18, 2025"),
      domain("servo-supply.example", "active", "pro", 642_918, "Jan 9, 2026"),
      domain("robo-parts.example", "active", "free", 214_506, "Feb 21, 2026"),
      domain("status.acme.test", "pending", "free", 0, "Oct 1, 2026"),
      domain("acmebots-legacy.example", "moved", "free", 1_204, "Nov 30, 2024"),
    ],
    workers: workers("ar", [
      { name: "api-gateway", type: "worker", template: "api-gateway", lastDeployed: "Oct 8, 2026 17:42 UTC", requests24h: 1_884_210, errors24h: 214, cpuMedianMs: 2.4 },
      { name: "marketing-site", type: "pages", template: "static-site", lastDeployed: "Oct 7, 2026 11:03 UTC", requests24h: 912_455, errors24h: 0, cpuMedianMs: 0.8 },
      { name: "image-resizer", type: "worker", template: "hello-world", lastDeployed: "Oct 5, 2026 08:27 UTC", requests24h: 403_118, errors24h: 37, cpuMedianMs: 11.6 },
      { name: "robot-telemetry", type: "worker", template: "api-gateway", lastDeployed: "Oct 2, 2026 14:05 UTC", requests24h: 276_940, errors24h: 12, cpuMedianMs: 3.1 },
      { name: "docs", type: "pages", template: "static-site", lastDeployed: "Sep 30, 2026 19:51 UTC", requests24h: 88_302, errors24h: 0, cpuMedianMs: 0.6 },
      { name: "webhook-relay", type: "worker", template: "hello-world", lastDeployed: "Sep 22, 2026 10:15 UTC", requests24h: 21_774, errors24h: 3, cpuMedianMs: 1.9 },
    ]),
    members: [
      { name: "Dana Park", email: "dana.park@acme-robotics.example", role: "administrator", status: "active", lastSeen: "Oct 9, 2026" },
      { name: "Mei Lin", email: "mei.lin@acme-robotics.example", role: "administrator", status: "active", lastSeen: "Oct 8, 2026" },
      { name: "Luis Moreno", email: "luis.moreno@acme-robotics.example", role: "developer", status: "active", lastSeen: "Oct 9, 2026" },
      { name: "Priya Raman", email: "priya.raman@acme-robotics.example", role: "developer", status: "active", lastSeen: "Oct 6, 2026" },
      { name: "Sam Okafor", email: "sam.okafor@acme-robotics.example", role: "viewer", status: "active", lastSeen: "Sep 29, 2026" },
    ],
    activity: [
      { id: "a1", actor: "Dana Park", action: "deployed", target: "api-gateway v12", at: "Oct 8, 2026 17:42 UTC" },
      { id: "a2", actor: "Luis Moreno", action: "added a DNS record to", target: "acme-robotics.example", at: "Oct 8, 2026 15:10 UTC" },
      { id: "a3", actor: "Priya Raman", action: "deployed", target: "marketing-site", at: "Oct 7, 2026 11:03 UTC" },
      { id: "a4", actor: "Mei Lin", action: "changed SSL/TLS mode on", target: "shop.acme-robotics.example", at: "Oct 6, 2026 09:30 UTC" },
      { id: "a5", actor: "Dana Park", action: "added the domain", target: "status.acme.test", at: "Oct 1, 2026 13:22 UTC" },
    ],
  },
  {
    id: "acme-labs",
    name: "Acme Labs (sandbox)",
    accountTag: "9b07d3e1c5a64f2e8d1b0a9c7e6f5d44",
    domains: [
      domain("labs.acme.test", "active", "free", 12_408, "Aug 4, 2026"),
      domain("playground.acme.test", "pending", "free", 0, "Oct 3, 2026"),
    ],
    workers: workers("al", [
      { name: "prototype-api", type: "worker", template: "hello-world", lastDeployed: "Oct 6, 2026 16:20 UTC", requests24h: 3_120, errors24h: 41, cpuMedianMs: 4.2 },
      { name: "lab-notes", type: "pages", template: "static-site", lastDeployed: "Sep 25, 2026 12:00 UTC", requests24h: 640, errors24h: 0, cpuMedianMs: 0.5 },
    ]),
    members: [
      { name: "Dana Park", email: "dana.park@acme-robotics.example", role: "administrator", status: "active", lastSeen: "Oct 9, 2026" },
      { name: "Luis Moreno", email: "luis.moreno@acme-robotics.example", role: "developer", status: "active", lastSeen: "Oct 5, 2026" },
    ],
    activity: [
      { id: "b1", actor: "Luis Moreno", action: "deployed", target: "prototype-api v4", at: "Oct 6, 2026 16:20 UTC" },
      { id: "b2", actor: "Dana Park", action: "added the domain", target: "playground.acme.test", at: "Oct 3, 2026 10:02 UTC" },
    ],
  },
];

export const CURRENT_USER = { name: "Dana Park", email: "dana.park@acme-robotics.example", initials: "DP" };
