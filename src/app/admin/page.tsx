"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalyticsAdminPanel } from "@/components/admin/analytics-panel";
import { LoanPlansAdminPanel } from "@/components/admin/loan-plans-panel";
import {
  ADMIN_SESSION_KEY,
  type AdminTab,
  parseAdminTab,
} from "@/lib/admin-session";

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseAdminTab(searchParams.get("tab"));
  const [secret, setSecret] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (stored) setSecret(stored);
  }, []);

  function saveSecret(value: string) {
    setSecret(value);
    if (value) sessionStorage.setItem(ADMIN_SESSION_KEY, value);
    else sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }

  function switchTab(nextTab: AdminTab) {
    router.replace(`/admin?tab=${nextTab}`, { scroll: false });
  }

  return (
    <div className="ym-page">
      <div className={`ym-container ym-admin${tab === "analytics" ? " ym-analytics" : ""}`}>
        <h1 className="ym-page-title">Yellow Metal admin</h1>
        <p className="ym-admin-lead">
          Manage loan plans and view website analytics. This area is not public.
        </p>

        <section className="ym-admin-panel">
          <label className="ym-admin-field" htmlFor="admin-secret">
            <span className="ym-admin-label">Admin password</span>
            <input
              id="admin-secret"
              className="ym-admin-input"
              type="password"
              value={secret}
              onChange={(event) => saveSecret(event.target.value)}
              placeholder="Enter your admin password"
              autoComplete="current-password"
            />
          </label>
        </section>

        <div className="ym-admin-tabs" role="tablist" aria-label="Admin sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "loan-plans"}
            className={`ym-admin-tab${tab === "loan-plans" ? " is-active" : ""}`}
            onClick={() => switchTab("loan-plans")}
          >
            Loan plans
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "analytics"}
            className={`ym-admin-tab${tab === "analytics" ? " is-active" : ""}`}
            onClick={() => switchTab("analytics")}
          >
            Analytics
          </button>
        </div>

        <div role="tabpanel">
          {!secret ? (
            <p className="ym-admin-empty ym-admin-tab-hint">
              Enter your admin password above to use this section.
            </p>
          ) : tab === "analytics" ? (
            <AnalyticsAdminPanel secret={secret} />
          ) : (
            <LoanPlansAdminPanel secret={secret} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="ym-page ym-admin-loading">Loading admin…</div>}>
      <AdminPageContent />
    </Suspense>
  );
}
