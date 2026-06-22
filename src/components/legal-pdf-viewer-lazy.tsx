"use client";

import dynamic from "next/dynamic";

export const LegalPdfViewer = dynamic(
  () =>
    import("@/components/legal-pdf-viewer").then(
      (module) => module.LegalPdfViewer,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="ym-legal-pdf-loading" role="status">
        Loading document…
      </p>
    ),
  },
);
