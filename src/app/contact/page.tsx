import { BRANCH_LOCATIONS } from "@/lib/branches";

export default function ContactPage() {
  return (
    <div className="ym-page">
      <div className="ym-container ym-contact-page">
        <h1 className="ym-page-title">Contact</h1>
        <p className="ym-section-subtitle">
          Have a question about gold loans? Reach out — we&apos;re happy to help.
        </p>

        <div className="ym-contact-grid">
          <div className="ym-contact-item">
            <p className="ym-contact-label">Phone</p>
            <p className="ym-contact-value">
              <a href="tel:+919090976076" className="ym-legal-link">
                90909 76076
              </a>
            </p>
          </div>
          <div className="ym-contact-item">
            <p className="ym-contact-label">Email</p>
            <p className="ym-contact-value">
              <a href="mailto:contact@yellowmetal.co" className="ym-legal-link">
                contact@yellowmetal.co
              </a>
            </p>
          </div>
        </div>

        <section className="ym-branches-section" aria-labelledby="ym-branches-title">
          <h2 id="ym-branches-title" className="ym-branches-title">
            Our branches
          </h2>
          <p className="ym-branches-intro">
            Visit any Yellow Metal Gold Loans branch across Karnataka and Andhra
            Pradesh.
          </p>

          <ul className="ym-branches-list">
            {[...BRANCH_LOCATIONS]
              .sort((a, b) => a.town.localeCompare(b.town))
              .map((branch) => (
              <li key={`${branch.town}-${branch.pincode}`} className="ym-branch-card">
                <p className="ym-branch-town">
                  {branch.town}
                  <span className="ym-branch-pincode">{branch.pincode}</span>
                </p>
                <p className="ym-branch-address">
                  Yellow Metal Gold Loans, {branch.address}
                </p>
              </li>
              ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
