import type { Metadata } from "next";
import { LegalLanguageSwitch } from "@/components/legal-language-switch";
import { ConsentNoticeBody } from "@/components/consent-notice-body";
import { CONSENT_NOTICE } from "@/content/consent-notice";

export const metadata: Metadata = {
  title: "ಜಾಲತಾಣ ದತ್ತಾಂಶ ಸಮ್ಮತಿ ಸೂಚನೆ — Yellow Metal",
  description:
    "ಈ ಜಾಲತಾಣದಲ್ಲಿ ಯೆಲ್ಲೋ ಮೆಟಲ್ ಸಂಗ್ರಹಿಸುವ ವೈಯಕ್ತಿಕ ದತ್ತಾಂಶ, ಅದರ ಉದ್ದೇಶ, ಮತ್ತು ದೂರು ನಿವಾರಣಾಧಿಕಾರಿ ವಿವರಗಳ ಸ್ವತಂತ್ರ ಸೂಚನೆ.",
};

export default function ConsentNoticeKannadaPage() {
  const copy = CONSENT_NOTICE.kn;

  return (
    <div className="ym-page">
      <div className="ym-container ym-prose ym-legal-document">
        <LegalLanguageSwitch active="kn" document="consent-notice" />
        <h1 className="ym-page-title" lang="kn">
          {copy.title}
        </h1>
        <ConsentNoticeBody language="kn" />
      </div>
    </div>
  );
}
