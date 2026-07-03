import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { REFUND_AND_CANCELLATION_BLOCKS } from "@/content/refund-and-cancellation-policy";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy — Yellow Metal",
  description:
    "Refund and Cancellation Policy of Yellow Metal Loans Private Limited, an RBI-registered NBFC.",
};

export default function RefundAndCancellationPage() {
  return <LegalDocument blocks={REFUND_AND_CANCELLATION_BLOCKS} />;
}
