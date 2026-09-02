import type { Metadata } from "next";
import { LegalLanguageSwitch } from "@/components/legal-language-switch";
import { ConsentNoticeActions } from "@/components/consent-notice";
import { ConsentNoticeBody } from "@/components/consent-notice-body";
import { CONSENT_NOTICE } from "@/content/consent-notice";

export const metadata: Metadata = {
  title: "Website data consent notice — Yellow Metal",
  description:
    "Standalone notice of what personal data Yellow Metal collects on this website, why, and how to contact the Grievance Officer.",
};

export default function ConsentNoticePage() {
  const copy = CONSENT_NOTICE.en;

  return (
    <div className="ym-page">
      <div className="ym-container ym-prose ym-legal-document">
        <LegalLanguageSwitch active="en" document="consent-notice" />
        <h1 className="ym-page-title">{copy.title}</h1>
        <ConsentNoticeBody language="en" />
        <ConsentNoticeActions language="en" />
      </div>
    </div>
  );
}
