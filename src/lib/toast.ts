import { useKumoToastManager } from "@cloudflare/kumo";

type Variant = "default" | "success" | "error" | "warning" | "info";

/** Thin wrapper so pages call toast("Record added") without repeating options. */
export function useToast() {
  const manager = useKumoToastManager();
  return (title: string, options: { description?: string; variant?: Variant } = {}) => {
    manager.add({ title, description: options.description, variant: options.variant ?? "success" });
  };
}
