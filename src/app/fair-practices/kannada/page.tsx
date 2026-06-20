import type { Metadata } from "next";
import { LegalLanguageSwitch } from "@/components/legal-language-switch";
import { LegalPdfViewer } from "@/components/legal-pdf-viewer";

const PDF_PATH = "/documents/fair-practices-code-kannada.pdf";

export const metadata: Metadata = {
  title: "ನ್ಯಾಯಸಮ್ಮತ ವ್ಯವಹಾರ ಪದ್ಧತಿ ಸಂಹಿತೆ — Yellow Metal",
  description:
    "Yellow Metal Loans Private Limited ನ RBI-registered NBFC Fair Practices Code — Kannada version.",
};

export default function FairPracticesKannadaPage() {
  return (
    <div className="ym-page">
      <div className="ym-container ym-prose ym-legal-document">
        <LegalLanguageSwitch active="kn" />
        <h1 className="ym-page-title">ನ್ಯಾಯಸಮ್ಮತ ವ್ಯವಹಾರ ಪದ್ಧತಿ ಸಂಹಿತೆ</h1>
        <p className="ym-legal-subtitle">Fair Practices Code</p>
        <p className="ym-legal-meta">
          ಆವೃತ್ತಿ 1/2026-27 · ಜಾರಿಗೆ 8 ಜೂನ್ 2026 · ನಿರ್ದೇಶಕರ ಮಂಡಳಿಯ
          ಅನುಮೋದನೆ
        </p>
        <p>
          ಈ ದಾಖಲೆಯು Yellow Metal Loans Private Limited ನ ಅಧಿಕೃತ ಕನ್ನಡ
          ನ್ಯಾಯಸಮ್ಮತ ವ್ಯವಹಾರ ಪದ್ಧತಿ ಸಂಹಿತೆಯಾಗಿದೆ. ಕೆಳಗಿನ PDF ನಲ್ಲಿ
          ಪೂರ್ಣ ವಿವರಗಳನ್ನು ಓದಬಹುದು.
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
