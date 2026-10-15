import { Badge } from "@cloudflare/kumo";
import type { DomainStatus, Role } from "../data/types.ts";
import { ROLE_LABEL } from "../lib/format.ts";

export const DOMAIN_STATUS_LABEL: Record<DomainStatus, string> = {
  active: "Active",
  pending: "Pending nameservers",
  moved: "Moved",
};

export function DomainStatusBadge({ status }: { status: DomainStatus }) {
  const variant = status === "active" ? "success" : status === "pending" ? "warning" : "neutral";
  return (
    <Badge variant={variant} appearance="dot">
      {DOMAIN_STATUS_LABEL[status]}
    </Badge>
  );
}

export function ProxyBadge({ proxied }: { proxied: boolean }) {
  return proxied ? <Badge variant="info">Proxied</Badge> : <Badge variant="neutral">DNS only</Badge>;
}

export function RoleBadge({ role }: { role: Role }) {
  const variant = role === "administrator" ? "purple" : role === "developer" ? "blue" : "neutral";
  return <Badge variant={variant}>{ROLE_LABEL[role]}</Badge>;
}
