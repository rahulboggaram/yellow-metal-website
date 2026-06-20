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
  return (
    <div className="ym-legal-pdf">
      <div className="ym-legal-pdf-actions">
        <a href={src} download className="ym-legal-pdf-download">
          {downloadLabel}
        </a>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="ym-legal-pdf-open"
        >
          Open in new tab
        </a>
      </div>
      <iframe
        src={src}
        title={title}
        className="ym-legal-pdf-frame"
      />
    </div>
  );
}
