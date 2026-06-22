import type { Metadata } from "next";
import { LegalLanguageSwitch } from "@/components/legal-language-switch";
import { LegalPdfViewer } from "@/components/legal-pdf-viewer-lazy";

const PDF_PATH = "/documents/fair-practices-code-kannada.pdf";

export const metadata: Metadata = {
  title: "Fair Practices Code - Kannada — Yellow Metal",
  description:
    "Kannada Fair Practices Code of Yellow Metal Loans Private Limited, an RBI-registered NBFC.",
};

export default function FairPracticesKannadaPage() {
  return (
    <div className="ym-page">
      <div className="ym-container ym-prose ym-legal-document ym-legal-document--pdf">
        <LegalLanguageSwitch active="kn" />
        <h1 className="ym-page-title">Fair Practices Code - Kannada</h1>
        <p className="ym-legal-subtitle">ನ್ಯಾಯಸಮ್ಮತ ವ್ಯವಹಾರ ಪದ್ಧತಿ ಸಂಹಿತೆ</p>
        <p className="ym-legal-meta">
          ಆವೃತ್ತಿ 1/2026-27 · ಜಾರಿಗೆ 8 ಜೂನ್ 2026 · ನಿರ್ದೇಶಕರ ಮಂಡಳಿಯ
          ಅನುಮೋದನೆ
        </p>
        <LegalPdfViewer
          src={PDF_PATH}
          title="ನ್ಯಾಯಸಮ್ಮತ ವ್ಯವಹಾರ ಪದ್ಧತಿ ಸಂಹಿತೆ — Kannada"
          downloadLabel="PDF ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ"
        />
      </div>
    </div>
  );
}
