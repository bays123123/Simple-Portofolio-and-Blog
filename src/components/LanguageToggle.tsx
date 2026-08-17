import { Languages, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  loading?: boolean;
  className?: string;
};

const LanguageToggle = ({ loading = false, className = "" }: Props) => {
  const { lang, toggleLang, t } = useLanguage();
  const label = lang === "id" ? t("switchToEnglish") : t("switchToIndonesian");

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${className}`}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
      <span>{lang === "id" ? "EN" : "ID"}</span>
    </button>
  );
};

export default LanguageToggle;
