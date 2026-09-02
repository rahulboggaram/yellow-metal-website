import Link from "next/link";

type LegalLanguage = "en" | "kn";
type LegalDocumentId = "fair-practices" | "consent-notice";

type LegalLanguageSwitchProps = {
  active: LegalLanguage;
  document?: LegalDocumentId;
};

const LANGUAGE_HREFS: Record<
  LegalDocumentId,
  Record<LegalLanguage, string>
> = {
  "fair-practices": {
    en: "/fair-practices",
    kn: "/fair-practices/kannada",
  },
  "consent-notice": {
    en: "/privacy/notice",
    kn: "/privacy/notice/kannada",
  },
};

const LANGUAGES: { id: LegalLanguage; label: string }[] = [
  { id: "en", label: "English" },
  { id: "kn", label: "ಕನ್ನಡ" },
];

export function LegalLanguageSwitch({
  active,
  document = "fair-practices",
}: LegalLanguageSwitchProps) {
  const hrefs = LANGUAGE_HREFS[document];

  return (
    <nav className="ym-legal-language-switch" aria-label="Document language">
      {LANGUAGES.map((language) => {
        const isActive = language.id === active;

        return isActive ? (
          <span
            key={language.id}
            className="ym-legal-language-switch-link is-active"
            aria-current="page"
            lang={language.id}
          >
            {language.label}
          </span>
        ) : (
          <Link
            key={language.id}
            href={hrefs[language.id]}
            className="ym-legal-language-switch-link"
            lang={language.id}
          >
            {language.label}
          </Link>
        );
      })}
    </nav>
  );
}
