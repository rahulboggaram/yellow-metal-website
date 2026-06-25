import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { GRIEVANCE_REDRESSAL_BLOCKS } from "@/content/grievance-redressal";

export const metadata: Metadata = {
  title: "Grievance Redressal — Yellow Metal",
  description:
    "Grievance Redressal policy of Yellow Metal Loans Private Limited, an RBI-registered NBFC.",
};

export default function GrievanceRedressalPage() {
  return <LegalDocument blocks={GRIEVANCE_REDRESSAL_BLOCKS} />;
}
