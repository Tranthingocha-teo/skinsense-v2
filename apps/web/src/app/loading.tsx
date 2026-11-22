import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";

// Shown the moment a link is pressed, while the next page renders on the server. Without it the old
// page just sits there until the new one is ready. Pure placeholder: no data, no behaviour.
export default async function Loading() {
  const t = await getTranslations("Common");
  return (
    <main className="flex flex-1 flex-col gap-4 p-6" role="status" aria-busy="true">
      <span className="sr-only">{t("loading")}</span>
      <Skeleton className="h-7 w-48 bg-foreground/9 motion-reduce:animate-none" />
      <Skeleton className="h-4 w-72 max-w-full bg-foreground/7 motion-reduce:animate-none" />
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-32 bg-foreground/7 motion-reduce:animate-none" />
        ))}
      </div>
    </main>
  );
}
