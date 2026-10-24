import { useEffect, type RefObject } from "react";

/** Publishes the height of the brand row so the sticky header can slide it out of view and keep only the nav bar. */
export function useStickyNav(header: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const row = header.current?.querySelector<HTMLElement>(".header-main");
    if (!row) return;
    const update = () => document.documentElement.style.setProperty("--hm-h", `${row.offsetHeight + 1}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(row);
    return () => observer.disconnect();
  }, [header]);
}
