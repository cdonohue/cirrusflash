import { useEffect } from "react";

/** Sets document.title as "Part · Part · Cirrusflash". */
export function useTitle(...parts: Array<string | undefined | false>) {
  const title = [...parts.filter(Boolean), "Cirrusflash"].join(" · ");
  useEffect(() => {
    document.title = title;
  }, [title]);
}
