"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Filter state kept in URL search parameters so any filtered view has a
 * shareable URL. Values equal to their defaults are removed from the URL.
 */
export function useUrlState(defaults: Record<string, string>) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const get = useCallback(
    (key: string): string => params.get(key) ?? defaults[key] ?? "",
    [params, defaults],
  );

  const setMany = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === defaults[key]) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router, defaults],
  );

  const set = useCallback(
    (key: string, value: string | null) => setMany({ [key]: value }),
    [setMany],
  );

  const reset = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return { get, set, setMany, reset, params };
}
