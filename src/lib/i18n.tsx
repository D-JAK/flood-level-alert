/**
 * Language switching (English / Malayalam).
 * Server always renders English so SSR and hydration agree; the stored
 * preference is applied in an effect right after mount.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export type Lang = "en" | "ml";

const STORAGE_KEY = "kdw-lang";

type LangCtx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Pick the string for the active language. */
  tr: (en: string, ml: string) => string;
};

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ml" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "ml" ? "ml" : "en";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — preference just won't persist */
    }
  }, []);

  const tr = useCallback((en: string, ml: string) => (lang === "ml" ? ml : en), [lang]);

  const value = useMemo(() => ({ lang, setLang, tr }), [lang, setLang, tr]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (ctx) return ctx;
  // Safe fallback (e.g. a component rendered outside the provider).
  return { lang: "en", setLang: () => {}, tr: (en) => en };
}

/** Convenience for the many { ml, en } pairs in the data layer. */
export function useBi() {
  const { lang } = useLang();
  return useCallback((pair: { en: string; ml: string }) => (lang === "ml" ? pair.ml : pair.en), [lang]);
}

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card p-0.5",
        className,
      )}
      role="group"
      aria-label="Language / ഭാഷ"
    >
      <Languages className="ml-1.5 size-3.5 text-muted-foreground" aria-hidden="true" />
      {(["en", "ml"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            lang === code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
          )}
        >
          {code === "en" ? "English" : <span className="ml">മലയാളം</span>}
        </button>
      ))}
    </div>
  );
}
