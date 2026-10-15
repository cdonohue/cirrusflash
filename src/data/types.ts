export type DomainStatus = "active" | "pending" | "moved";
export type Plan = "free" | "pro" | "business";
export type DnsType = "A" | "AAAA" | "CNAME" | "TXT" | "MX";
export type Ttl = "auto" | "60" | "300" | "3600";
export type SslMode = "off" | "flexible" | "full" | "strict";
export type Role = "administrator" | "developer" | "viewer";
export type WorkerType = "worker" | "pages";
export type Template = "hello-world" | "static-site" | "api-gateway";

export interface DnsRecord {
  id: string;
  type: DnsType;
  name: string;
  content: string;
  proxied: boolean;
  ttl: Ttl;
  priority?: number;
  /** A note for the people who manage the zone. */
  comment?: string;
}

export interface Domain {
  name: string;
  status: DomainStatus;
  plan: Plan;
  requests24h: number;
  addedOn: string;
  nameservers: [string, string];
  records: DnsRecord[];
  ssl: { mode: SslMode; alwaysHttps: boolean };
}

export interface Deployment {
  id: string;
  version: string;
  message: string;
  author: string;
  deployedAt: string;
  status: "active" | "superseded";
}

export interface Variable {
  name: string;
  value: string;
  secret: boolean;
}

export interface Worker {
  name: string;
  type: WorkerType;
  template: Template;
  lastDeployed: string;
  requests24h: number;
  errors24h: number;
  cpuMedianMs: number;
  logs: boolean;
  deployments: Deployment[];
  variables: Variable[];
}

export interface Member {
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited";
  lastSeen: string;
}

export interface Activity {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
}

export interface Account {
  id: string;
  name: string;
  accountTag: string;
  domains: Domain[];
  workers: Worker[];
  members: Member[];
  activity: Activity[];
}
