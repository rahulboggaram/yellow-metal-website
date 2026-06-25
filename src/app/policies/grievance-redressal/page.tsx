import type { Metadata } from "next";
import Link from "next/link";
import { LegalPdfViewer } from "@/components/legal-pdf-viewer-lazy";

const PDF_PATH = "/documents/grievance-redressal.pdf";

export const metadata: Metadata = {
  title: "Grievance Redressal — Yellow Metal",
  description:
    "Grievance Redressal policy of Yellow Metal Loans Private Limited, an RBI-registered NBFC.",
};

export default function GrievanceRedressalPage() {
  return (
    <div className="ym-page">
      <div className="ym-container ym-prose ym-legal-document ym-legal-document--pdf">
        <p className="ym-legal-back">
          <Link href="/policies" className="ym-legal-link">
            ← All policies
          </Link>
        </p>
        <h1 className="ym-page-title">Grievance Redressal</h1>
        <p className="ym-legal-meta">
          Yellow Metal Loans Private Limited · RBI-registered NBFC
        </p>
        <LegalPdfViewer
          src={PDF_PATH}
          title="Grievance Redressal — Yellow Metal"
          downloadLabel="Download PDF"
        />
      </div>
    </div>
  );
}
