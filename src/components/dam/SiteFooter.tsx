import { ExternalLink, Github } from "lucide-react";
import { FEEDS } from "@/lib/dams";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SiteFooter() {
  const { tr, lang } = useLang();
  const ml = lang === "ml";
  return (
    <footer className="mt-10 border-t border-border bg-card/50">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-6 text-xs text-muted-foreground">
        <p className={cn(ml && "ml")}>
          <span className="font-semibold text-foreground">
            {tr("Data sources", "വിവരങ്ങളുടെ ഉറവിടം")}:
          </span>{" "}
          {tr(
            "readings are fetched live from the open Kerala-Dam-Water-Levels dataset, which mirrors the official KSEB and Kerala Irrigation / KSDMA bulletins. Nothing here is entered by hand.",
            "കെ.എസ്.ഇ.ബി, ജലസേചന വിഭാഗം / KSDMA ബുള്ളറ്റിനുകൾ ശേഖരിക്കുന്ന Kerala-Dam-Water-Levels ഓപ്പൺ ഡാറ്റാസെറ്റിൽ നിന്ന് നേരിട്ട് വിവരങ്ങൾ എടുക്കുന്നു. ഒന്നും കൈകൊണ്ട് ചേർത്തതല്ല.",
          )}
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          <li>
            <a
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              href="https://github.com/amith-vp/Kerala-Dam-Water-Levels"
              target="_blank"
              rel="noreferrer noopener"
            >
              <Github className="size-3.5" aria-hidden="true" />
              amith-vp/Kerala-Dam-Water-Levels
            </a>
          </li>
          <li>
            <a
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              href="https://github.com/amith-vp"
              target="_blank"
              rel="noreferrer noopener"
            >
              {tr("Dataset by Amith VP", "ഡാറ്റാസെറ്റ്: അമിത് വി.പി")}
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </li>
          <li>
            <a
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              href={FEEDS.kseb.source}
              target="_blank"
              rel="noreferrer noopener"
            >
              {tr("KSEB dam bulletin", "കെ.എസ്.ഇ.ബി ബുള്ളറ്റിൻ")}
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </li>
          <li>
            <a
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              href={FEEDS.irrigation.source}
              target="_blank"
              rel="noreferrer noopener"
            >
              {tr("KSDMA dam levels", "KSDMA ഡാം ലെവൽ")}
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </li>
        </ul>
        <p className={cn("pt-1", ml && "ml")}>
          {tr("Created by a member of ", "നിർമ്മിച്ചത്: ")}
          <span className="font-semibold text-foreground">Techypedia</span>
          {tr(
            ". Not an official government service — always follow instructions from KSDMA and your district administration.",
            " അംഗം. ഇത് സർക്കാരിന്റെ ഔദ്യോഗിക സേവനമല്ല — KSDMA യുടെയും ജില്ലാ ഭരണകൂടത്തിന്റെയും നിർദ്ദേശങ്ങൾ പാലിക്കുക.",
          )}
        </p>
      </div>
    </footer>
  );
}
