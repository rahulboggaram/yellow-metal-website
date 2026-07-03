import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { INTEREST_RATE_POLICY_BLOCKS } from "@/content/interest-rate-policy";

export const metadata: Metadata = {
  title: "Interest Rate & Penal Charges Policy — Yellow Metal",
  description:
    "Interest Rate & Penal Charges Policy of Yellow Metal Loans Private Limited, an RBI-registered NBFC.",
};

export default function InterestRatePolicyPage() {
  return <LegalDocument blocks={INTEREST_RATE_POLICY_BLOCKS} />;
}
