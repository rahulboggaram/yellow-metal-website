import type { Metadata } from "next";
import { SITE_FAQS } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "FAQs — Yellow Metal",
  description:
    "Frequently asked questions about Yellow Metal gold loans, rates, and services.",
};

export default function FaqPage() {
  return (
    <div className="ym-page">
      <div className="ym-container ym-prose ym-faq-page">
        <h1 className="ym-page-title">FAQs</h1>
        <p className="ym-section-subtitle">
          Answers to common questions about gold loans and our lending rates.
        </p>

        <ol className="ym-faq-list">
          {SITE_FAQS.map((faq, index) => (
            <li key={faq.question} className="ym-faq-item">
              <p className="ym-faq-number" aria-hidden>
                {index + 1}.
              </p>
              <div className="ym-faq-content">
                <h2 className="ym-faq-question">{faq.question}</h2>
                <p className="ym-faq-answer">{faq.answer}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
