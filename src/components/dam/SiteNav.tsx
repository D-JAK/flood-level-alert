import { Link } from "@tanstack/react-router";
import { Droplets, Map, PhoneCall } from "lucide-react";

const items = [
  { to: "/", icon: Droplets, ml: "ഡാമുകൾ", en: "Dams" },
  { to: "/map", icon: Map, ml: "ഭൂപടം", en: "Map" },
  { to: "/emergency", icon: PhoneCall, ml: "അടിയന്തരം", en: "Emergency" },
] as const;

export function SiteNav() {
  return (
    <nav
      aria-label="Main"
      className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3 text-xs font-medium"
    >
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.to === "/" }}
          activeProps={{
            className: "border-primary bg-primary/10 text-primary",
          }}
          inactiveProps={{ className: "border-border bg-card text-muted-foreground" }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <item.icon className="size-3.5" aria-hidden="true" />
          <span className="ml">{item.ml}</span>
          <span className="opacity-70">{item.en}</span>
        </Link>
      ))}
    </nav>
  );
}