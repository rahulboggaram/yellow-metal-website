"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalyticsAdminPanel } from "@/components/admin/analytics-panel";
import { EngagementAdminPanel } from "@/components/admin/engagement-panel";
import { AdminLottiePreview } from "@/components/admin/lottie-preview";
import { LoanPlansAdminPanel } from "@/components/admin/loan-plans-panel";
import { FloatingInput } from "@/components/ui/floating-field";
import {
  ADMIN_SESSION_KEY,
  type AdminTab,
  parseAdminTab,
  verifyAdminSecret,
} from "@/lib/admin-session";

const TABS: {
  id: AdminTab;
  label: string;
  icon: "analytics" | "engagement" | "plans";
}[] = [
  { id: "analytics", label: "Analytics", icon: "analytics" },
  { id: "engagement", label: "Engagement", icon: "engagement" },
  { id: "loan-plans", label: "Loan plans", icon: "plans" },
];

function NavIcon({ name }: { name: (typeof TABS)[number]["icon"] }) {
  if (name === "analytics") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className="ym-admin-nav-icon">
        <path
          d="M4 19V5M4 19h16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M8 15v-3M12 15V9M16 15v-5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (name === "engagement") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className="ym-admin-nav-icon">
        <path
          d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="ym-admin-nav-icon">
      <rect
        x="4"
        y="6"
        width="16"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 10h8M8 14h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
        <div className="ym-admin-gate-layout">
          <div className="ym-admin-gate-brand">
            <Image
              src="/images/ym-admin-vertical-logo.png"
              alt="Yellow Metal"
              width={1024}
              height={477}
              className="ym-admin-gate-logo"
              priority
            />
            <p className="ym-admin-gate-label">Admin</p>
          </div>

          <div className="ym-admin-gate">
            <h1 className="ym-admin-gate-title">Sign in</h1>
            <p className="ym-admin-gate-lead">
              Manage loan plans and review website analytics.
            </p>

            <form
              className="ym-admin-gate-form"
              onSubmit={(event) => void handlePasswordSubmit(event)}
            >
              <FloatingInput
                id="admin-secret"
                label="Password"
                type="password"
                value={passwordInput}
                onChange={(event) => {
                  setPasswordInput(event.target.value);
                  setAuthError(null);
                }}
                autoComplete="current-password"
                autoFocus
                error={Boolean(authError)}
                fieldError={authError ?? undefined}
              />

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
      </div>
    );
  }

  return (
    <div className="ym-admin-shell ym-admin-shell--app">
      <aside className="ym-admin-sidebar" aria-label="Admin navigation">
        <div className="ym-admin-sidebar-brand">
          <Image
            src="/images/ym-admin-logo.png"
            alt="Yellow Metal"
            width={1024}
            height={195}
            className="ym-admin-sidebar-logo"
            priority
          />
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
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="ym-admin-sidebar-footer">
          <button
            type="button"
            className="ym-admin-nav-item ym-admin-nav-item--quiet"
            onClick={signOut}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="ym-admin-main">
        <div className="ym-admin-content-card">
          <header className="ym-admin-main-header">
            <div className="ym-admin-main-title-row">
              <h1 className="ym-admin-main-title">{activeTab.label}</h1>
              {tab === "analytics" ? (
                <AdminLottiePreview
                  animation="financial-graph"
                  className="ym-admin-title-lottie"
                  size={80}
                  speed={0.5}
                />
              ) : null}
              {tab === "engagement" ? (
                <AdminLottiePreview
                  animation="favorites"
                  className="ym-admin-title-lottie"
                  size={80}
                  endFrame={46}
                />
              ) : null}
              {tab === "loan-plans" ? (
                <AdminLottiePreview
                  animation="loan"
                  className="ym-admin-title-lottie"
                  size={80}
                  endFrame={25}
                />
              ) : null}
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
