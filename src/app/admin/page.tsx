"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";
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

const TABS: { id: AdminTab; label: string; description: string }[] = [
  {
    id: "analytics",
    label: "Analytics",
    description: "Page views and visitors",
  },
  {
    id: "engagement",
    label: "Engagement",
    description: "Calculator and rate clock",
  },
  {
    id: "loan-plans",
    label: "Loan plans",
    description: "Rates and plan setup",
  },
];

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

  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0];

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
      <div className="ym-admin-shell">
        <div className="ym-admin-loading">Checking access…</div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="ym-admin-shell ym-admin-shell--gate">
        <div className="ym-admin-gate">
          <div className="ym-admin-gate-brand">
            <Image
              src="/images/ym-logo.png"
              alt="Yellow Metal"
              width={200}
              height={100}
              className="ym-admin-gate-logo"
              priority
            />
            <p className="ym-admin-gate-eyebrow">Internal tools</p>
          </div>

          <h1 className="ym-admin-gate-title">Sign in</h1>
          <p className="ym-admin-gate-lead">
            Manage loan plans and review website analytics.
          </p>

          <form
            className="ym-admin-gate-form"
            onSubmit={(event) => void handlePasswordSubmit(event)}
          >
            <label className="ym-admin-field" htmlFor="admin-secret">
              <span className="ym-admin-label">Password</span>
              <input
                id="admin-secret"
                className="ym-admin-input"
                type="password"
                value={passwordInput}
                onChange={(event) => {
                  setPasswordInput(event.target.value);
                  setAuthError(null);
                }}
                placeholder="Enter admin password"
                autoComplete="current-password"
                autoFocus
              />
            </label>

            {authError && (
              <p className="ym-admin-message ym-admin-message--error" role="alert">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="ym-admin-btn ym-admin-btn--primary ym-admin-btn--block"
              disabled={authLoading}
            >
              {authLoading ? "Checking…" : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="ym-admin-shell ym-admin-shell--app">
      <aside className="ym-admin-sidebar" aria-label="Admin navigation">
        <div className="ym-admin-sidebar-brand">
          <Image
            src="/images/ym-logo.png"
            alt="Yellow Metal"
            width={160}
            height={80}
            className="ym-admin-sidebar-logo"
            priority
          />
          <span className="ym-admin-sidebar-badge">Admin</span>
        </div>

        <nav className="ym-admin-nav" role="tablist" aria-label="Admin sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`ym-admin-nav-item${tab === item.id ? " is-active" : ""}`}
              onClick={() => switchTab(item.id)}
            >
              <span className="ym-admin-nav-label">{item.label}</span>
              <span className="ym-admin-nav-desc">{item.description}</span>
            </button>
          ))}
        </nav>

        <div className="ym-admin-sidebar-footer">
          <button
            type="button"
            className="ym-admin-btn ym-admin-btn--ghost ym-admin-btn--block"
            onClick={signOut}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="ym-admin-main">
        <header className="ym-admin-main-header">
          <div>
            <p className="ym-admin-main-eyebrow">Yellow Metal</p>
            <h1 className="ym-admin-main-title">{activeTab.label}</h1>
            <p className="ym-admin-main-lead">{activeTab.description}</p>
          </div>
          <button
            type="button"
            className="ym-admin-btn ym-admin-btn--ghost ym-admin-main-signout"
            onClick={signOut}
          >
            Sign out
          </button>
        </header>

        <div role="tabpanel" className="ym-admin-main-content">
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
    <Suspense
      fallback={
        <div className="ym-admin-shell">
          <div className="ym-admin-loading">Loading admin…</div>
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
