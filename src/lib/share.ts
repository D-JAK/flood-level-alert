import { fmt, formatAge, type AlertLevel, type Dam } from "@/lib/dams";

export const SITE_URL = "https://flood-level-alert.lovable.app";

const ALERT_EMOJI: Record<AlertLevel, string> = {
  RED: "🔴",
  ORANGE: "🟠",
  BLUE: "🔵",
  NORMAL: "🟢",
  UNKNOWN: "⚪",
};

const ALERT_LABEL: Record<AlertLevel, { en: string; ml: string }> = {
  RED: { en: "Red alert", ml: "അതീവ ജാഗ്രത" },
  ORANGE: { en: "Orange alert", ml: "ജാഗ്രത" },
  BLUE: { en: "Blue alert", ml: "ശ്രദ്ധിക്കുക" },
  NORMAL: { en: "Normal", ml: "സാധാരണ" },
  UNKNOWN: { en: "Unknown", ml: "അറിയില്ല" },
};

type Lang = "en" | "ml";

function line(a: string, b: string, lang: Lang) {
  return lang === "ml" ? b : a;
}

/** Plain-text card for one dam — real values only, no invented numbers. */
export function damShareText(dam: Dam, lang: Lang): string {
  const age = formatAge(dam.ageHours);
  const rows: string[] = [
    `${ALERT_EMOJI[dam.alert]} *${dam.name}*${dam.district ? ` — ${dam.district}` : ""}`,
    `${line("Status", "നില", lang)}: ${line(ALERT_LABEL[dam.alert].en, ALERT_LABEL[dam.alert].ml, lang)}`,
  ];

  if (dam.suppressReading) {
    rows.push(line("No current data available", "നിലവിലെ വിവരം ലഭ്യമല്ല", lang));
  } else {
    rows.push(`${line("Water level", "ജലനിരപ്പ്", lang)}: ${fmt(dam.waterLevel, " m")}`);
    if (dam.frl !== null) rows.push(`FRL: ${fmt(dam.frl, " m")}`);
    if (dam.storagePercentage !== null)
      rows.push(`${line("Storage", "സംഭരണം", lang)}: ${fmt(dam.storagePercentage, "%", 1)}`);
    if (dam.spillwayRelease !== null)
      rows.push(`${line("Spillway release", "ഷട്ടർ തുറന്ന ഒഴുക്ക്", lang)}: ${fmt(dam.spillwayRelease, " m³/s")}`);
    if (dam.inflow !== null)
      rows.push(`${line("Inflow", "ഒഴുക്ക്", lang)}: ${fmt(dam.inflow, " m³/s")}`);
  }

  rows.push(
    `${line("Reading", "വിവരം", lang)}: ${dam.readingDateLabel ?? "—"} (${lang === "ml" ? age.ml : age.en})`,
  );
  if (dam.staleness !== "fresh") rows.push(line("⚠️ Data is stale", "⚠️ വിവരം പഴയതാണ്", lang));
  rows.push("", `${SITE_URL}/dam/${dam.uid}`);
  rows.push(
    line(
      "Unofficial aggregator — confirm with KSDMA.",
      "അനൗദ്യോഗിക സമാഹാരം — KSDMA-യുമായി സ്ഥിരീകരിക്കുക.",
      lang,
    ),
  );
  return rows.join("\n");
}

/** Plain-text card summarising a district (or the whole state) view. */
export function districtShareText(
  scope: string | null,
  dams: Dam[],
  lang: Lang,
): string {
  const title = scope
    ? line(`Kerala Dam Watch — ${scope} district`, `കേരള ഡാം വാച്ച് — ${scope}`, lang)
    : line("Kerala Dam Watch — all Kerala", "കേരള ഡാം വാച്ച് — കേരളം മുഴുവൻ", lang);

  const counts = { RED: 0, ORANGE: 0, BLUE: 0, stale: 0 };
  for (const d of dams) {
    if (d.alert === "RED") counts.RED++;
    else if (d.alert === "ORANGE") counts.ORANGE++;
    else if (d.alert === "BLUE") counts.BLUE++;
    if (d.suppressReading || d.staleness !== "fresh") counts.stale++;
  }

  const rows: string[] = [
    `*${title}*`,
    `${line("Dams", "ഡാമുകൾ", lang)}: ${dams.length}`,
    `🔴 ${line(ALERT_LABEL.RED.en, ALERT_LABEL.RED.ml, lang)}: ${counts.RED}  🟠 ${line(ALERT_LABEL.ORANGE.en, ALERT_LABEL.ORANGE.ml, lang)}: ${counts.ORANGE}  🔵 ${line(ALERT_LABEL.BLUE.en, ALERT_LABEL.BLUE.ml, lang)}: ${counts.BLUE}`,
  ];
  if (counts.stale > 0)
    rows.push(`⚠️ ${line("Stale / no data", "പഴയ / ഇല്ലാത്ത വിവരം", lang)}: ${counts.stale}`);

  const notable = dams
    .filter((d) => d.alert === "RED" || d.alert === "ORANGE" || d.alert === "BLUE")
    .slice(0, 6);
  if (notable.length > 0) {
    rows.push("");
    for (const d of notable) {
      rows.push(
        `${ALERT_EMOJI[d.alert]} ${d.name}: ${d.suppressReading ? line("no data", "വിവരമില്ല", lang) : fmt(d.waterLevel, " m")}`,
      );
    }
  }

  rows.push("", SITE_URL);
  rows.push(
    line(
      "Unofficial aggregator — confirm with KSDMA.",
      "അനൗദ്യോഗിക സമാഹാരം — KSDMA-യുമായി സ്ഥിരീകരിക്കുക.",
      lang,
    ),
  );
  return rows.join("\n");
}

/**
 * wa.me redirects desktop browsers to api.whatsapp.com, which privacy
 * browsers (Brave, etc.) block outright. Send desktop users straight to
 * WhatsApp Web and keep the wa.me deep link for mobile.
 */
export function whatsappUrl(text: string, isMobile = true): string {
  const q = encodeURIComponent(text);
  return isMobile ? `https://wa.me/?text=${q}` : `https://web.whatsapp.com/send?text=${q}`;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return true;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}
