import { useEffect, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { isMobileDevice, whatsappUrl } from "@/lib/share";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ShareButton({
  text,
  label,
  className,
  compact = false,
}: {
  text: string;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const { tr, lang } = useLang();
  const ml = lang === "ml";
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(true);

  useEffect(() => setMobile(isMobileDevice()), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={tr("Share update", "അപ്ഡേറ്റ് പങ്കിടുക")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium hover:bg-accent",
          ml && "ml",
          className,
        )}
      >
        <Share2 className="size-3.5" aria-hidden />
        {!compact && (label ?? tr("Share", "പങ്കിടുക"))}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(20rem,90vw)] space-y-2 p-3">
        <pre
          className={cn(
            "max-h-48 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-snug whitespace-pre-wrap",
            ml && "ml",
          )}
        >
          {text}
        </pre>
        <div className="flex gap-2">
          <a
            href={whatsappUrl(text, mobile)}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90",
              ml && "ml",
            )}
          >
            {mobile
              ? tr("Send on WhatsApp", "വാട്‌സ്ആപ്പിൽ അയക്കുക")
              : tr("Send on WhatsApp Web", "വാട്‌സ്ആപ്പ് വെബിൽ അയക്കുക")}
          </a>
          <button
            type="button"
            onClick={copy}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent",
              ml && "ml",
            )}
          >
            {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            {copied ? tr("Copied", "പകർത്തി") : tr("Copy", "പകർത്തുക")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
