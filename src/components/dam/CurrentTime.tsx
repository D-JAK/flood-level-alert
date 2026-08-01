import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

export function CurrentTime({ className }: { className?: string }) {
  const { lang } = useLang();
  const hydrated = useHydrated();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!hydrated || !now) return null;

  const locale = lang === "ml" ? "ml-IN" : "en-IN";
  const date = now.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div
      className={cn(
        "inline-flex flex-col items-end text-right text-xs tabular-nums leading-tight",
        className,
      )}
    >
      <span className="font-medium text-foreground">{time}</span>
      <span className="text-muted-foreground">{date}</span>
    </div>
  );
}
