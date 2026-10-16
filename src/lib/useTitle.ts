import { useEffect } from "react";

/** Sets document.title as "Part · Part · Stratobeam". */
export function useTitle(...parts: Array<string | undefined | false>) {
  const title = [...parts.filter(Boolean), "Stratobeam"].join(" · ");
  useEffect(() => {
    document.title = title;
  }, [title]);
}
