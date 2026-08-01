import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Floating "back to top" button, appears after the user scrolls down. */
export function ScrollToTop() {
  const { tr } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const label = tr("Back to top", "മുകളിലേക്ക്");

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-5 right-4 z-50 inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-all hover:bg-accent",
        show ? "pointer-events-auto opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </button>
  );
}