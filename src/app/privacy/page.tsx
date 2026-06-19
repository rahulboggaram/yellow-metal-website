import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { PRIVACY_POLICY_BLOCKS } from "@/content/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy policy — Yellow Metal",
  description:
    "Privacy Policy of Yellow Metal Loans Private Limited, an RBI-registered NBFC.",
};

export default function PrivacyPage() {
  return <LegalDocument blocks={PRIVACY_POLICY_BLOCKS} />;
}
