import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Github, Linkedin, MessageCircle } from "lucide-react";
import { FEEDS } from "@/lib/dams";
import { DisclaimerBar } from "@/components/dam/bits";
import { SiteNav } from "@/components/dam/SiteNav";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TITLE = "Credits & data sources — Kerala Dam Watch";
const DESC =
  "Credits and data sources behind Kerala Dam Watch: the Kerala-Dam-Water-Levels dataset by Amith VP, official KSEB and KSDMA bulletins, and NDMA Sachet alerts.";

export const Route = createFileRoute("/credits")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: CreditsPage,
});

type Credit = {
  title: string;
  href: string;
  what: { en: string; ml: string };
  icon?: "github" | "linkedin" | "chat";
};

const CREDITS: Credit[] = [
  {
    title: "Daliya Joseph",
    href: "https://www.linkedin.com/in/daliyajoseph/",
    icon: "linkedin",
    what: { en: "Built this app.", ml: "ഈ ആപ്പ് നിർമ്മിച്ചത്." },
  },
  {
    title: "Kerala-Dam-Water-Levels — Amith VP",
    href: "https://github.com/amith-vp/Kerala-Dam-Water-Levels",
    icon: "github",
    what: {
      en: "The open dataset this dashboard reads. Amith VP scrapes the official KSEB and Irrigation bulletins and publishes them as live.json / irrigation_live.json. All dam readings here come from this feed.",
      ml: "ഈ ഡാഷ്‌ബോർഡ് ഉപയോഗിക്കുന്ന ഓപ്പൺ ഡാറ്റാസെറ്റ്. അമിത് വി.പി. കെ.എസ്.ഇ.ബി, ജലസേചന ബുള്ളറ്റിനുകൾ ശേഖരിച്ച് live.json ആയി പ്രസിദ്ധീകരിക്കുന്നു. ഇവിടെയുള്ള ജലനിരപ്പ് വിവരങ്ങൾ ഈ ഫീഡിൽ നിന്നാണ്.",
    },
  },
  {
    title: "KSEB dam bulletin",
    href: FEEDS.kseb.source,
    what: {
      en: "Official Kerala State Electricity Board reservoir bulletin — the upstream source for KSEB dams.",
      ml: "കെ.എസ്.ഇ.ബി ഡാം ബുള്ളറ്റിൻ — കെ.എസ്.ഇ.ബി ഡാമുകളുടെ ഔദ്യോഗിക ഉറവിടം.",
    },
  },
  {
    title: "KSDMA / Irrigation dam levels",
    href: FEEDS.irrigation.source,
    what: {
      en: "Kerala State Disaster Management Authority and Irrigation Department dam level bulletins.",
      ml: "KSDMA, ജലസേചന വിഭാഗം ഡാം ലെവൽ ബുള്ളറ്റിനുകൾ.",
    },
  },
  {
    title: "NDMA Sachet",
    href: "https://sachet.ndma.gov.in/",
    what: {
      en: "National Disaster Management Authority public CAP feed — the official rain, flood and flash-flood alerts shown on the dashboard.",
      ml: "എൻ.ഡി.എം.എ സചേത് പൊതു CAP ഫീഡ് — ഡാഷ്‌ബോർഡിലെ ഔദ്യോഗിക മഴ, വെള്ളപ്പൊക്ക അലേർട്ടുകൾ.",
    },
  },
  {
    title: "India-WRIS flood forecast",
    href: "https://aff.india-water.gov.in/home.php",
    what: {
      en: "Central Water Commission river flood forecast portal. Currently unreachable from our servers; it will be used automatically once it responds.",
      ml: "കേന്ദ്ര ജല കമ്മീഷന്റെ നദി പ്രവചന പോർട്ടൽ. ഇപ്പോൾ ലഭ്യമല്ല; ലഭ്യമാകുമ്പോൾ സ്വയമേവ ഉപയോഗിക്കും.",
    },
  },
  {
    title: "Project source code — D-JAK/flood-level-alert",
    href: "https://github.com/D-JAK/flood-level-alert",
    icon: "github",
    what: { en: "This app's code.", ml: "ഈ ആപ്പിന്റെ കോഡ്." },
  },
  {
    title: "Techiepedia",
    href: "https://chat.whatsapp.com/Ld4pktw8OEh9LvOcdKa2N8",
    icon: "chat",
    what: {
      en: "Community behind the project — join on WhatsApp.",
      ml: "പ്രോജക്ടിന് പിന്നിലുള്ള കൂട്ടായ്മ — വാട്ട്‌സ്ആപ്പിൽ ചേരുക.",
    },
  },
];

function Icon({ icon }: { icon?: Credit["icon"] }) {
  if (icon === "github") return <Github className="size-3.5 shrink-0" aria-hidden="true" />;
  if (icon === "linkedin") return <Linkedin className="size-3.5 shrink-0" aria-hidden="true" />;
  if (icon === "chat") return <MessageCircle className="size-3.5 shrink-0" aria-hidden="true" />;
  return <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />;
}

function CreditsPage() {
  const { tr, lang } = useLang();
  const ml = lang === "ml";
  return (
    <div className="min-h-screen bg-background pb-16">
      <DisclaimerBar />
      <SiteNav />
      <main className="mx-auto max-w-3xl space-y-4 px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className={cn(ml && "ml")}>{tr("Dashboard", "ഡാഷ്‌ബോർഡ്")}</span>
        </Link>

        <header>
          <h1 className={cn("text-2xl font-semibold tracking-tight", ml && "ml")}>
            {tr("Credits & data sources", "കടപ്പാട്, വിവര ഉറവിടങ്ങൾ")}
          </h1>
          <p className={cn("mt-1 text-xs text-muted-foreground", ml && "ml")}>
            {tr(
              "Every number in this app comes from one of the sources below. Nothing is entered by hand.",
              "ഈ ആപ്പിലെ എല്ലാ വിവരങ്ങളും താഴെയുള്ള ഉറവിടങ്ങളിൽ നിന്നാണ്. ഒന്നും കൈകൊണ്ട് ചേർത്തതല്ല.",
            )}
          </p>
        </header>

        <ul className="space-y-3">
          {CREDITS.map((c) => (
            <li key={c.href} className="rounded-xl border border-border bg-card p-3">
              <a
                href={c.href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <Icon icon={c.icon} />
                {c.title}
              </a>
              <p className={cn("mt-1 text-xs text-muted-foreground", ml && "ml")}>
                {ml ? c.what.ml : c.what.en}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}