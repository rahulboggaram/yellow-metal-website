import type { Metadata } from "next";
import Link from "next/link";
import { SITE_POLICIES } from "@/lib/policies";

export const metadata: Metadata = {
  title: "Policies — Yellow Metal",
  description:
    "Privacy policy, terms and conditions, and other policies for Yellow Metal Loans.",
};

export default function PoliciesPage() {
  return (
    <div className="ym-page">
      <div className="ym-container ym-prose">
        <h1 className="ym-page-title">Policies</h1>
        <p className="ym-section-subtitle">
          Legal and regulatory documents for Yellow Metal Loans Private Limited.
        </p>

        <ul className="ym-policies-list">
          {SITE_POLICIES.map((policy) => (
            <li key={policy.href}>
              <Link href={policy.href} className="ym-policies-card">
                <span className="ym-policies-card-title">{policy.label}</span>
                <span className="ym-policies-card-description">
                  {policy.description}
                </span>
                <span className="ym-policies-card-arrow" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
