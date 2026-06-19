import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { TERMS_AND_CONDITIONS_BLOCKS } from "@/content/terms-and-conditions";

export const metadata: Metadata = {
  title: "Terms & conditions — Yellow Metal",
  description:
    "Terms and Conditions for use of the Yellow Metal Loans website.",
};

export default function TermsPage() {
  return <LegalDocument blocks={TERMS_AND_CONDITIONS_BLOCKS} />;
}
