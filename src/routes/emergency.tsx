import { createFileRoute } from "@tanstack/react-router";
import { Phone, WifiOff } from "lucide-react";
import { CONTACT_GROUPS } from "@/lib/emergency-contacts";
import { DisclaimerBar } from "@/components/dam/bits";
import { SiteNav } from "@/components/dam/SiteNav";

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
  return (
    <div className="min-h-screen bg-background pb-16">
      <DisclaimerBar />
      <SiteNav />
      <main className="mx-auto max-w-3xl space-y-5 px-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="ml block text-base font-medium text-muted-foreground">
              അടിയന്തര ഫോൺ നമ്പറുകൾ
            </span>
            Emergency contacts
          </h1>
          <p className="mt-2 flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
            <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="ml font-semibold text-foreground">
                ഇന്റർനെറ്റ് ഇല്ലാതെയും ഈ പേജ് പ്രവർത്തിക്കും.
              </span>{" "}
              These numbers are stored inside the app — this page works with no network. Numbers are
              public, statewide lines; your district control room may differ.
            </span>
          </p>
        </header>

        {CONTACT_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`g-${group.id}`}>
            <h2 id={`g-${group.id}`} className="text-sm font-semibold tracking-tight">
              <span className="ml">{group.ml}</span>
              <span className="ml-2 text-xs font-medium text-muted-foreground">{group.en}</span>
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
                      <span className="ml block text-sm font-semibold">{c.ml}</span>
                      <span className="block text-xs text-muted-foreground">{c.en}</span>
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