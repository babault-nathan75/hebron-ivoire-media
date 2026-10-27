import { SITE_DEFAULTS } from "@shared/siteSettings";
import { trpc } from "@/lib/trpc";

/** Editable site texts: the value saved in the back office, or the built-in default when the field is empty. */
export function useSiteText() {
  const { data } = trpc.site.settings.useQuery(undefined, { staleTime: 30_000 });
  return (key: string) => data?.[key] || SITE_DEFAULTS[key] || "";
}
