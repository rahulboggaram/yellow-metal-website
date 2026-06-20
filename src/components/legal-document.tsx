import Link from "next/link";
import type { ReactNode } from "react";

export type LegalBlock =
  | { type: "title"; text: string }
  | { type: "subtitle"; text: string }
  | { type: "meta"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string };

function renderParagraph(text: string) {
  const privacyHref = "/privacy";
  const parts = text.split(/(www\.yellowmetal\.co\/privacy-policy|\/privacy)/g);

  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, index) => {
    if (part === "www.yellowmetal.co/privacy-policy" || part === "/privacy") {
      return (
        <Link key={index} href={privacyHref} className="ym-legal-link">
          Privacy policy
        </Link>
      );
    }
    return part;
  });
}

export function LegalDocument({
  blocks,
  languageSwitch,
}: {
  blocks: readonly LegalBlock[];
  languageSwitch?: ReactNode;
}) {
  return (
    <div className="ym-page">
      <div className="ym-container ym-prose ym-legal-document">
        {languageSwitch}
        {blocks.map((block, index) => {
          switch (block.type) {
            case "title":
              return (
                <h1 key={index} className="ym-page-title">
                  {block.text}
                </h1>
              );
            case "subtitle":
              return (
                <p key={index} className="ym-legal-subtitle">
                  {block.text}
                </p>
              );
            case "meta":
              return (
                <p key={index} className="ym-legal-meta">
                  {block.text}
                </p>
              );
            case "h2":
              return <h2 key={index}>{block.text}</h2>;
            case "h3":
              return <h3 key={index}>{block.text}</h3>;
            case "p":
              return (
                <p
                  key={index}
                  className={
                    block.text === block.text.toUpperCase() &&
                    block.text.length < 220
                      ? "ym-legal-emphasis"
                      : undefined
                  }
                >
                  {renderParagraph(block.text)}
                </p>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
