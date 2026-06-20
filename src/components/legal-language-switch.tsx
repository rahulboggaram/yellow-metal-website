import Link from "next/link";

type LegalLanguageSwitchProps = {
  active: "en" | "kn";
};

const LANGUAGES = [
  { id: "en" as const, label: "English", href: "/fair-practices" },
  {
    id: "kn" as const,
    label: "ಕನ್ನಡ",
    href: "/fair-practices/kannada",
  },
];

export function LegalLanguageSwitch({ active }: LegalLanguageSwitchProps) {
  return (
    <nav className="ym-legal-language-switch" aria-label="Document language">
      {LANGUAGES.map((language) => {
        const isActive = language.id === active;

        return isActive ? (
          <span
            key={language.id}
            className="ym-legal-language-switch-link is-active"
            aria-current="page"
          >
            {language.label}
          </span>
        ) : (
          <Link
            key={language.id}
            href={language.href}
            className="ym-legal-language-switch-link"
          >
            {language.label}
          </Link>
        );
      })}
    </nav>
  );
}
