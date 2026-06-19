const TRUST_MARKS = [
  {
    id: "bis",
    label: "100% secured BIS certified lockers",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="9" width="16" height="11" rx="1.25" stroke="currentColor" strokeWidth="1.75" />
        <path d="M4 12h16" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="12" cy="15" r="1.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 16.25v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "insured",
    label: "100% insured storages",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3.5l7.5 3v6.25c0 4.9-3.2 7.6-7.5 9.25-4.3-1.65-7.5-4.35-7.5-9.25V6.5L12 3.5z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M9.25 12.25l2 2 4.25-4.25"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "vault",
    label: "24×7 monitored vaults",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="12" cy="12" r="1.35" fill="currentColor" />
        <path
          d="M12 7.75v1.5M12 14.75v1.5M7.75 12h1.5M14.75 12h1.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
] as const;

type Props = {
  visible?: boolean;
};

export function CustodyTrustMarks({ visible = false }: Props) {
  return (
    <div
      className={["ym-trust-marks", visible && "ym-trust-marks--visible"].filter(Boolean).join(" ")}
      aria-label="Custody assurances"
    >
      {TRUST_MARKS.map((mark) => (
        <div key={mark.id} className="ym-trust-pill">
          <span className="ym-trust-pill-icon" aria-hidden>
            {mark.icon}
          </span>
          <p className="ym-trust-pill-label">{mark.label}</p>
        </div>
      ))}
    </div>
  );
}
