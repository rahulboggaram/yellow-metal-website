"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalyticsAdminPanel } from "@/components/admin/analytics-panel";
import { EngagementAdminPanel } from "@/components/admin/engagement-panel";
import { LoanPlansAdminPanel } from "@/components/admin/loan-plans-panel";
import {
  ADMIN_SESSION_KEY,
  type AdminTab,
  parseAdminTab,
  verifyAdminSecret,
} from "@/lib/admin-session";

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseAdminTab(searchParams.get("tab"));
  const [secret, setSecret] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);

  const unlock = useCallback(
    async (value: string) => {
      setAuthLoading(true);
      setAuthError(null);
      const ok = await verifyAdminSecret(value);
      if (!ok) {
        setAuthError("Wrong password. Try again.");
        setIsUnlocked(false);
        setSecret("");
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        setAuthLoading(false);
        return false;
      }
      sessionStorage.setItem(ADMIN_SESSION_KEY, value);
      setSecret(value);
      setIsUnlocked(true);
      setAuthLoading(false);
      if (!searchParams.get("tab")) {
        router.replace("/admin?tab=analytics", { scroll: false });
      }
      return true;
    },
    [router, searchParams],
  );

  useEffect(() => {
    let active = true;
    async function restore() {
      const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (!stored) {
        if (active) setRestoringSession(false);
        return;
      }
      await unlock(stored);
      if (active) setRestoringSession(false);
    }
    void restore();
    return () => {
      active = false;
    };
  }, [unlock]);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = passwordInput.trim();
    if (!trimmed) {
      setAuthError("Enter your admin password.");
      return;
    }
    await unlock(trimmed);
  }

  function signOut() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setSecret("");
    setPasswordInput("");
    setIsUnlocked(false);
    setAuthError(null);
  }

  function switchTab(nextTab: AdminTab) {
    router.replace(`/admin?tab=${nextTab}`, { scroll: false });
  }

  if (restoringSession) {
    return (
      <div className="ym-page">
        <div className="ym-container ym-admin">
          <p className="ym-admin-loading">Checking admin access…</p>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="ym-page">
        <div className="ym-container ym-admin ym-admin-gate">
          <h1 className="ym-page-title">Yellow Metal admin</h1>
          <p className="ym-admin-lead">
            Enter your admin password to manage loan plans and view website analytics.
          </p>

          <form className="ym-admin-panel ym-admin-gate-form" onSubmit={(event) => void handlePasswordSubmit(event)}>
            <label className="ym-admin-field" htmlFor="admin-secret">
              <span className="ym-admin-label">Admin password</span>
              <input
                id="admin-secret"
                className="ym-admin-input"
                type="password"
                value={passwordInput}
                onChange={(event) => {
                  setPasswordInput(event.target.value);
                  setAuthError(null);
                }}
                placeholder="Enter your admin password"
                autoComplete="current-password"
                autoFocus
              />
            </label>

            {authError && <p className="ym-admin-message">{authError}</p>}

            <div className="ym-admin-actions">
              <button
                type="submit"
                className="ym-admin-btn ym-admin-btn--primary"
                disabled={authLoading}
              >
                {authLoading ? "Checking…" : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="ym-page">
      <div className={`ym-container ym-admin${tab === "analytics" || tab === "engagement" ? " ym-analytics" : ""}`}>
        <div className="ym-admin-header">
          <div>
            <h1 className="ym-page-title">Yellow Metal admin</h1>
            <p className="ym-admin-lead">
              Manage loan plans and view website analytics.
            </p>
          </div>
          <button
            type="button"
            className="ym-admin-btn ym-admin-btn--ghost"
            onClick={signOut}
          >
            Sign out
          </button>
        </div>

        <div className="ym-admin-tabs" role="tablist" aria-label="Admin sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "analytics"}
            className={`ym-admin-tab${tab === "analytics" ? " is-active" : ""}`}
            onClick={() => switchTab("analytics")}
          >
            Analytics
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "engagement"}
            className={`ym-admin-tab${tab === "engagement" ? " is-active" : ""}`}
            onClick={() => switchTab("engagement")}
          >
            Engagement
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "loan-plans"}
            className={`ym-admin-tab${tab === "loan-plans" ? " is-active" : ""}`}
            onClick={() => switchTab("loan-plans")}
          >
            Loan plans
          </button>
        </div>

        <div role="tabpanel">
          {tab === "analytics" ? (
            <AnalyticsAdminPanel secret={secret} />
          ) : tab === "engagement" ? (
            <EngagementAdminPanel secret={secret} />
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
