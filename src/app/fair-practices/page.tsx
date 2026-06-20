import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { LegalLanguageSwitch } from "@/components/legal-language-switch";
import { FAIR_PRACTICES_CODE_BLOCKS } from "@/content/fair-practices-code";

export const metadata: Metadata = {
  title: "Fair Practices Code — Yellow Metal",
  description:
    "Fair Practices Code of Yellow Metal Loans Private Limited, an RBI-registered NBFC.",
};

export default function FairPracticesPage() {
  return (
    <LegalDocument
      blocks={FAIR_PRACTICES_CODE_BLOCKS}
      languageSwitch={<LegalLanguageSwitch active="en" />}
    />
  );
}
