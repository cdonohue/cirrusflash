import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import { DEMO_NOW, SEED_ACCOUNTS, nameserversFor } from "../data/seed.ts";
import type { Account, DnsRecord, Domain, Member, Plan, Role, SslMode, Template, Variable, Worker } from "../data/types.ts";

/*
 * In-memory store. It is rebuilt from the seed on every full page load and
 * survives client-side navigation, so a flow can add something on one page
 * and see it on another.
 */

interface State {
  accounts: Account[];
  currentAccountId: string;
  /** Monotonic counter for new ids; keeps ids deterministic. */
  nextId: number;
}

type Action =
  | { type: "switch-account"; accountId: string }
  | { type: "rename-account"; name: string }
  | { type: "add-domain"; name: string; plan: Plan }
  | { type: "save-record"; domain: string; record: Omit<DnsRecord, "id">; id?: string }
  | { type: "delete-record"; domain: string; id: string }
  | { type: "save-ssl"; domain: string; mode: SslMode; alwaysHttps: boolean }
  | { type: "create-worker"; name: string; template: Template }
  | { type: "delete-worker"; name: string }
  | { type: "set-worker-logs"; name: string; logs: boolean }
  | { type: "add-variable"; worker: string; variable: Variable }
  | { type: "delete-variable"; worker: string; name: string }
  | { type: "invite-member"; email: string; role: Role };

function updateAccount(state: State, fn: (account: Account) => Account): State {
  return {
    ...state,
    accounts: state.accounts.map((a) => (a.id === state.currentAccountId ? fn(a) : a)),
  };
}

function updateDomain(state: State, name: string, fn: (d: Domain) => Domain): State {
  return updateAccount(state, (a) => ({ ...a, domains: a.domains.map((d) => (d.name === name ? fn(d) : d)) }));
}

function updateWorker(state: State, name: string, fn: (w: Worker) => Worker): State {
  return updateAccount(state, (a) => ({ ...a, workers: a.workers.map((w) => (w.name === name ? fn(w) : w)) }));
}

function activity(state: State, action: string, target: string) {
  return { id: `n${state.nextId}`, actor: "Dana Park", action, target, at: DEMO_NOW };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "switch-account":
      return { ...state, currentAccountId: action.accountId };

    case "rename-account":
      return updateAccount(state, (a) => ({ ...a, name: action.name }));

    case "add-domain": {
      const newDomain: Domain = {
        name: action.name,
        status: "pending",
        plan: action.plan,
        requests24h: 0,
        addedOn: "Oct 9, 2026",
        nameservers: nameserversFor(action.name),
        records: [],
        ssl: { mode: "flexible", alwaysHttps: false },
      };
      const next = updateAccount(state, (a) => ({
        ...a,
        domains: [newDomain, ...a.domains],
        activity: [activity(state, "added the domain", action.name), ...a.activity],
      }));
      return { ...next, nextId: state.nextId + 1 };
    }

    case "save-record": {
      const { domain, record, id } = action;
      if (id) {
        return updateDomain(state, domain, (d) => ({
          ...d,
          records: d.records.map((r) => (r.id === id ? { ...record, id } : r)),
        }));
      }
      const next = updateDomain(state, domain, (d) => ({
        ...d,
        records: [{ ...record, id: `r${state.nextId}` }, ...d.records],
      }));
      return { ...next, nextId: state.nextId + 1 };
    }

    case "delete-record":
      return updateDomain(state, action.domain, (d) => ({
        ...d,
        records: d.records.filter((r) => r.id !== action.id),
      }));

    case "save-ssl":
      return updateDomain(state, action.domain, (d) => ({
        ...d,
        ssl: { mode: action.mode, alwaysHttps: action.alwaysHttps },
      }));

    case "create-worker": {
      const worker: Worker = {
        name: action.name,
        type: action.template === "static-site" ? "pages" : "worker",
        template: action.template,
        lastDeployed: DEMO_NOW,
        requests24h: 0,
        errors24h: 0,
        cpuMedianMs: 0,
        logs: true,
        variables: [],
        deployments: [
          {
            id: `d${state.nextId}`,
            version: "v1",
            message: "Initial deployment",
            author: "Dana Park",
            deployedAt: DEMO_NOW,
            status: "active",
          },
        ],
      };
      const next = updateAccount(state, (a) => ({
        ...a,
        workers: [worker, ...a.workers],
        activity: [activity(state, "deployed", action.name), ...a.activity],
      }));
      return { ...next, nextId: state.nextId + 1 };
    }

    case "delete-worker":
      return updateAccount(state, (a) => ({ ...a, workers: a.workers.filter((w) => w.name !== action.name) }));

    case "set-worker-logs":
      return updateWorker(state, action.name, (w) => ({ ...w, logs: action.logs }));

    case "add-variable":
      return updateWorker(state, action.worker, (w) => ({
        ...w,
        variables: [...w.variables.filter((v) => v.name !== action.variable.name), action.variable],
      }));

    case "delete-variable":
      return updateWorker(state, action.worker, (w) => ({
        ...w,
        variables: w.variables.filter((v) => v.name !== action.name),
      }));

    case "invite-member": {
      // "riley.chen@..." becomes "Riley Chen" until they accept and set a name.
      const local = action.email.split("@")[0] ?? action.email;
      const name = local
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part[0]!.toUpperCase() + part.slice(1))
        .join(" ");
      const member: Member = {
        name: name || action.email,
        email: action.email,
        role: action.role,
        status: "invited",
        lastSeen: "Never",
      };
      return updateAccount(state, (a) => ({ ...a, members: [...a.members, member] }));
    }
  }
}

const initialState: State = {
  accounts: SEED_ACCOUNTS,
  currentAccountId: SEED_ACCOUNTS[0]!.id,
  nextId: 1,
};

interface StoreValue {
  state: State;
  account: Account;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => {
    const account = state.accounts.find((a) => a.id === state.currentAccountId) ?? state.accounts[0]!;
    return { state, account, dispatch };
  }, [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside <StoreProvider>");
  return value;
}
