import { Link } from "@tanstack/react-router";
import { Droplets, Map, Navigation, PhoneCall } from "lucide-react";
import { LanguageToggle, useLang } from "@/lib/i18n";
import { CurrentTime } from "@/components/dam/CurrentTime";
import { ThemeToggle } from "@/lib/theme";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: Droplets, ml: "ഡാമുകൾ", en: "Dams" },
  { to: "/map", icon: Map, ml: "ഭൂപടം", en: "Map" },
  { to: "/nearby", icon: Navigation, ml: "എന്റെ അടുത്ത്", en: "Near me" },
  { to: "/emergency", icon: PhoneCall, ml: "അടിയന്തരം", en: "Emergency" },
] as const;

export function SiteNav() {
  const { lang } = useLang();
  return (
    <div className="mx-auto max-w-5xl px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Main" className="flex gap-2 overflow-x-auto text-xs font-medium">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "border-primary bg-primary/10 text-primary" }}
              inactiveProps={{ className: "border-border bg-card text-muted-foreground" }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <item.icon className="size-3.5" aria-hidden="true" />
              <span className={cn(lang === "ml" && "ml")}>{lang === "ml" ? item.ml : item.en}</span>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <CurrentTime />
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
}
