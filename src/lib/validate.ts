import { z } from "zod";
import type { DnsType } from "../data/types.ts";

/** Returns the first error message, or undefined when the value is valid. */
function firstError(schema: z.ZodType, value: unknown): string | undefined {
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

const LABEL = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
const HOSTNAME_RE = new RegExp(`^(?:${LABEL}\\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$`, "i");

const domainSchema = z
  .string()
  .trim()
  .min(1, "Enter a domain name.")
  .max(253, "Domain names can be at most 253 characters.")
  .refine((v) => !/^https?:\/\//i.test(v), "Enter just the domain, without http:// or https://.")
  .refine((v) => HOSTNAME_RE.test(v), "Enter a valid domain, like example.com.");

export function validateDomain(value: string, existing: string[]): string | undefined {
  const error = firstError(domainSchema, value);
  if (error) return error;
  if (existing.includes(value.trim().toLowerCase())) return "This domain is already in your account.";
  return undefined;
}

const hostnameSchema = z
  .string()
  .trim()
  .min(1, "Enter a hostname.")
  .refine((v) => HOSTNAME_RE.test(v.replace(/\.$/, "")), "Enter a valid hostname, like mail.example.com.");

const recordNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name. Use @ for the root.")
  .max(63 * 4, "Name is too long.")
  .refine(
    (v) => v === "@" || /^(\*\.)?[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?(?:\.[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?)*$/i.test(v),
    "Use letters, digits, hyphens, underscores and dots, or @ for the root.",
  );

export function validateRecordName(value: string): string | undefined {
  return firstError(recordNameSchema, value);
}

export const CONTENT_FIELD: Record<DnsType, { label: string; placeholder: string; description: string }> = {
  A: { label: "IPv4 address", placeholder: "192.0.2.10", description: "The IPv4 address this name points to." },
  AAAA: { label: "IPv6 address", placeholder: "2001:db8::10", description: "The IPv6 address this name points to." },
  CNAME: { label: "Target", placeholder: "www.example.com", description: "The hostname this name is an alias for." },
  TXT: { label: "Content", placeholder: "v=spf1 include:_spf.example.com ~all", description: "Up to 2,048 characters of text." },
  MX: { label: "Mail server", placeholder: "mail.example.com", description: "The hostname of the server that accepts mail." },
};

const contentSchemas: Record<DnsType, z.ZodType> = {
  A: z.string().trim().min(1, "Enter an IPv4 address.").pipe(z.ipv4({ message: "Enter a valid IPv4 address, like 192.0.2.10." })),
  AAAA: z.string().trim().min(1, "Enter an IPv6 address.").pipe(z.ipv6({ message: "Enter a valid IPv6 address, like 2001:db8::10." })),
  CNAME: hostnameSchema,
  MX: hostnameSchema,
  TXT: z.string().min(1, "Enter the record content.").max(2048, "TXT content can be at most 2,048 characters."),
};

export function validateRecordContent(type: DnsType, value: string): string | undefined {
  return firstError(contentSchemas[type], value);
}

const prioritySchema = z
  .string()
  .trim()
  .min(1, "Enter a priority.")
  .refine((v) => /^\d+$/.test(v) && Number(v) <= 65535, "Priority must be a whole number from 0 to 65535.");

export function validatePriority(value: string): string | undefined {
  return firstError(prioritySchema, value);
}

const workerNameSchema = z
  .string()
  .min(3, "Use at least 3 characters.")
  .max(40, "Use at most 40 characters.")
  .regex(/^[a-z0-9-]+$/, "Use only lowercase letters, digits and hyphens.");

export function validateWorkerName(value: string, existing: string[]): string | undefined {
  const error = firstError(workerNameSchema, value);
  if (error) return error;
  if (existing.includes(value)) return "An application with this name already exists.";
  return undefined;
}

const variableNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a variable name.")
  .regex(/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/, "Use UPPER_SNAKE_CASE, like API_BASE_URL.");

export function validateVariableName(value: string, existing: string[]): string | undefined {
  const error = firstError(variableNameSchema, value);
  if (error) return error;
  if (existing.includes(value.trim())) return "A variable with this name already exists.";
  return undefined;
}

const emailSchema = z.string().trim().min(1, "Enter an email address.").pipe(z.email({ message: "Enter a valid email address, like name@example.com." }));

export function validateEmail(value: string, existing: string[]): string | undefined {
  const error = firstError(emailSchema, value);
  if (error) return error;
  if (existing.includes(value.trim().toLowerCase())) return "This person is already a member.";
  return undefined;
}

export function validateRequired(value: string, message: string): string | undefined {
  return value.trim() ? undefined : message;
}
