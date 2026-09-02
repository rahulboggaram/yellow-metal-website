import Link from "next/link";
import { GRIEVANCE_OFFICER } from "@/lib/grievance-officer";
import {
  CONSENT_NOTICE,
  type ConsentNoticeLanguage,
} from "@/content/consent-notice";

export function ConsentNoticeBody({
  language,
}: {
  language: ConsentNoticeLanguage;
}) {
  const copy = CONSENT_NOTICE[language];

  return (
    <div className="ym-consent-body" lang={language}>
      <p className="ym-consent-standalone">{copy.standalone}</p>
      <p className="ym-consent-intro">{copy.intro}</p>

      <h3 className="ym-consent-heading">{copy.dataHeading}</h3>
      <ol className="ym-consent-items">
        {copy.items.map((item) => (
          <li key={item.data} className="ym-consent-item">
            <p className="ym-consent-item-data">{item.data}</p>
            <p>
              <span className="ym-consent-item-label">{copy.purposeLabel}</span>
              {item.purpose}
            </p>
            <p>
              <span className="ym-consent-item-label">{copy.enablesLabel}</span>
              {item.enables}
            </p>
          </li>
        ))}
      </ol>

      <h3 className="ym-consent-heading">{copy.notOnSiteHeading}</h3>
      <p>{copy.notOnSite}</p>

      <h3 className="ym-consent-heading">{copy.rightsHeading}</h3>
      <ul className="ym-consent-rights">
        {copy.rights.map((right) => (
          <li key={right}>{right}</li>
        ))}
      </ul>

      <h3 className="ym-consent-heading">{copy.officerHeading}</h3>
      <p>{copy.officerIntro}</p>
      <dl className="ym-consent-officer">
        <div>
          <dt>{copy.officerNameLabel}</dt>
          <dd>{GRIEVANCE_OFFICER.name}</dd>
        </div>
        <div>
          <dt>{copy.officerRoleLabel}</dt>
          <dd>{GRIEVANCE_OFFICER.designation}</dd>
        </div>
        <div>
          <dt>{copy.officerEmailLabel}</dt>
          <dd>
            <a href={`mailto:${GRIEVANCE_OFFICER.email}`}>
              {GRIEVANCE_OFFICER.email}
            </a>
          </dd>
        </div>
        <div>
          <dt>{copy.officerPhoneLabel}</dt>
          <dd>
            <a href={`tel:+91${GRIEVANCE_OFFICER.phone}`}>
              {GRIEVANCE_OFFICER.phoneDisplay}
            </a>
          </dd>
        </div>
        <div>
          <dt>{copy.officerAddressLabel}</dt>
          <dd>{GRIEVANCE_OFFICER.address}</dd>
        </div>
      </dl>

      <h3 className="ym-consent-heading">{copy.boardHeading}</h3>
      <p>{copy.board}</p>
      <p className="ym-consent-withdraw">{copy.withdraw}</p>
      <p className="ym-consent-policy">
        <Link href="/privacy" className="ym-legal-link">
          {copy.policyLink}
        </Link>
      </p>
    </div>
  );
}
