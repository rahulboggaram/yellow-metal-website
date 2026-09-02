"use client";

import { useEffect, useId, useState } from "react";
import {
  CONSENT_NOTICE,
  type ConsentNoticeLanguage,
} from "@/content/consent-notice";
import {
  readWebsiteConsent,
  writeWebsiteConsent,
} from "@/lib/website-consent";

export function ConsentNoticeActions({
  language,
}: {
  language: ConsentNoticeLanguage;
}) {
  const copy = CONSENT_NOTICE[language];
  const checkboxId = useId();
  const [checked, setChecked] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const record = readWebsiteConsent();
    if (record?.analytics) {
      setAgreed(true);
      setChecked(true);
    }
  }, []);

  const agree = () => {
    if (!checked) return;
    writeWebsiteConsent(true);
    setAgreed(true);
  };

  return (
    <form
      className="ym-consent-agree"
      lang={language}
      onSubmit={(event) => {
        event.preventDefault();
        agree();
      }}
    >
      <label className="ym-consent-check" htmlFor={checkboxId}>
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        <span>{copy.checkboxLabel}</span>
      </label>
      <button
        type="submit"
        className="ym-consent-btn ym-consent-btn--primary"
        disabled={!checked}
      >
        {copy.agree}
      </button>
      {agreed ? <p className="ym-consent-status">{copy.agreedStatus}</p> : null}
    </form>
  );
}
