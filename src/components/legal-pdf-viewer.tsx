"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type LegalPdfViewerProps = {
  src: string;
  title: string;
  downloadLabel: string;
};

export function LegalPdfViewer({
  src,
  title,
  downloadLabel,
}: LegalPdfViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const updateWidth = () => {
      setPageWidth(Math.floor(viewport.clientWidth));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="ym-legal-pdf">
      <div className="ym-legal-pdf-actions">
        <a href={src} download className="ym-legal-pdf-download">
          {downloadLabel}
        </a>
      </div>
      <div
        ref={viewportRef}
        className="ym-legal-pdf-viewport"
        aria-label={title}
      >
        {pageWidth > 0 ? (
          <Document
            file={src}
            loading={
              <p className="ym-legal-pdf-loading" role="status">
                Loading document…
              </p>
            }
            error={
              <p className="ym-legal-pdf-loading" role="alert">
                Could not load this document. Use the download button above.
              </p>
            }
            onLoadSuccess={({ numPages }) => setPageCount(numPages)}
          >
            {Array.from({ length: pageCount }, (_, index) => (
              <Page
                key={`page-${index + 1}`}
                pageNumber={index + 1}
                width={pageWidth}
                className="ym-legal-pdf-page"
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            ))}
          </Document>
        ) : (
          <p className="ym-legal-pdf-loading" role="status">
            Loading document…
          </p>
        )}
      </div>
    </div>
  );
}
