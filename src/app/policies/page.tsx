import type { Metadata } from "next";
import Link from "next/link";
import { SITE_POLICIES } from "@/lib/policies";

export const metadata: Metadata = {
  title: "Policies — Yellow Metal",
  description:
    "Privacy policy, terms and conditions, and other policies for Yellow Metal Loans.",
};

function PolicyChevron() {
  return (
    <svg
      className="ym-policies-card-chevron"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 4.5 10 8 6 11.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PoliciesPage() {
  return (
    <div className="ym-page">
      <div className="ym-container ym-prose ym-policies-page">
        <h1 className="ym-page-title">Policies</h1>
        <p className="ym-section-subtitle">
          Legal and regulatory documents for Yellow Metal Loans Private Limited.
        </p>

        <ul className="ym-policies-list">
          {SITE_POLICIES.map((policy) => (
            <li key={policy.href}>
              <Link href={policy.href} className="ym-policies-card">
                <span className="ym-policies-card-title">{policy.label}</span>
                <PolicyChevron />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
