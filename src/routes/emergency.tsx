import { createFileRoute } from "@tanstack/react-router";
import { Phone, WifiOff } from "lucide-react";
import { CONTACT_GROUPS } from "@/lib/emergency-contacts";
import { DisclaimerBar } from "@/components/dam/bits";
import { SiteNav } from "@/components/dam/SiteNav";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TITLE = "Emergency contacts — Kerala Dam Watch";
const DESC =
  "അടിയന്തര ഫോൺ നമ്പറുകൾ. Offline-ready Kerala flood and disaster emergency phone numbers: police, fire, ambulance, KSDMA, KSEB and helplines, with one-tap calling.";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: EmergencyPage,
});

function EmergencyPage() {
  const { tr, lang } = useLang();
  const ml = lang === "ml";
  return (
    <div className="min-h-screen bg-background pb-16">
      <DisclaimerBar />
      <SiteNav />
      <main className="mx-auto max-w-3xl space-y-5 px-4">
        <header>
          <h1 className={cn("text-2xl font-semibold tracking-tight", ml && "ml")}>
            {tr("Emergency contacts", "അടിയന്തര ഫോൺ നമ്പറുകൾ")}
          </h1>
          <p className="mt-2 flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
            <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className={cn(ml && "ml")}>
              <span className="font-semibold text-foreground">
                {tr(
                  "This page works with no network.",
                  "ഇന്റർനെറ്റ് ഇല്ലാതെയും ഈ പേജ് പ്രവർത്തിക്കും.",
                )}
              </span>{" "}
              {tr(
                "These numbers are stored inside the app. They are public, statewide lines; your district control room may differ.",
                "ഈ നമ്പറുകൾ ആപ്പിനുള്ളിൽ സൂക്ഷിച്ചിരിക്കുന്നു. ഇവ സംസ്ഥാനതല പൊതു നമ്പറുകളാണ്; നിങ്ങളുടെ ജില്ലാ കൺട്രോൾ റൂം വ്യത്യസ്തമായിരിക്കാം.",
              )}
            </span>
          </p>
        </header>

        {CONTACT_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`g-${group.id}`}>
            <h2 id={`g-${group.id}`} className="text-sm font-semibold tracking-tight">
              <span className={cn(ml && "ml")}>{ml ? group.ml : group.en}</span>
            </h2>
            <ul className="mt-2 space-y-2">
              {group.contacts.map((c) => (
                <li key={`${group.id}-${c.number}-${c.en}`}>
                  <a
                    href={`tel:${c.number}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Phone className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm font-semibold", ml && "ml")}>
                        {ml ? c.ml : c.en}
                      </span>
                      {c.note && (
                        <span className="block text-[0.7rem] text-muted-foreground">{c.note}</span>
                      )}
                    </span>
                    <span className="shrink-0 font-mono text-sm font-semibold text-primary">
                      {c.number}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}