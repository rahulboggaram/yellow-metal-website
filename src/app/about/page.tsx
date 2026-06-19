import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About us — Yellow Metal",
  description:
    "Yellow Metal was founded in 2020 to transform how rural India uses household gold — with simple, fair gold loans.",
};

const FOCUS_AREAS = [
  {
    title: "Building Awareness",
    paragraphs: [
      "There are at least 8 hidden charges on any gold loan from a bank or a financier. Processing Charges, Valuation Charges, Stamp Duties & 18 more. Leading gold loan company earns ₹14,000 – ₹20,000 for every one lakh loan per year for the most secured loan in this whole freaking world!!!",
      "Why does this anger us? 😡",
      "Banks earn ₹3,000 – ₹9,000 for every one lakh on a high-risk loan. Risky because there are no assets that you hand over to the bank as security. For a gold loan, jewelry is handed over, and in most cases that will help recover the full value of a gold loan if the customers don't pay. Then why are the interest rates so high?",
      "It all leads to people's awareness. We will teach them the right things!",
    ],
  },
  {
    title: "Access",
    paragraphs: [
      "80 Crore Indians have mobile phones. Any products can be delivered to nook and corner of the country through the Internet. But an emergency need for money has to wait! Every bank and its branch does not have a gold loan facility. 📈 The national average has one gold loan branch per 40 sq km.",
    ],
  },
  {
    title: "Affordability",
    paragraphs: [
      "Gold loan is a close-knit industry. A large part of the organized market is controlled by a handful of brands. Banks have shown no interest in improving their services. Financiers have to run a branch that costs a lot. Unorganised lenders prey on consumers' emergency needs. All these reasons increase the total cost of the gold loans to the end consumer.",
    ],
  },
] as const;

export default function AboutPage() {
  return (
    <div className="ym-page">
      <div className="ym-container ym-prose ym-about-page">
        <h1 className="ym-page-title">Our Vision</h1>
        <p className="ym-about-meta">By Rahul Boggaram · January 2022</p>

        <p>
          125 Crore (1.25 billion) Indians cannot borrow money.
        </p>
        <p>
          Contrarily, Indians have the highest amount of gold in their homes,
          its worth approximately 110 Lakh Crores ($1.4 Trillion). Over 70% of
          this gold is in rural India, where people struggle the most to borrow
          money. Yellow Metal was founded in 2020 with the purpose to transform
          the way people use their household gold. We are on a mission to
          monetise this gold mine for rural India to make their lives better.
          The first step in this direction is to enable rural India with a
          simple gold loan at their home in 30 mins.
        </p>

        <p>
          Gold Loan is an industry dominated by aged players with no intention or
          reward to change. We want to revolutionize this industry. There are 3
          big areas we will focus towards:
        </p>

        {FOCUS_AREAS.map((area) => (
          <section key={area.title}>
            <h2>{area.title}</h2>
            {area.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}

        <p className="ym-about-closing">We will change them all!</p>

        <section className="ym-about-podcast">
          <h2>Listen to our back story</h2>
          <p>
            Hear our journey to starting up on{" "}
            <em>That One Idea</em>, hosted by Anjali Sosale from Waterbridge
            Ventures —{" "}
            <a
              href="https://open.spotify.com/show/3YIxtJmZMHG0aoL5AglYNP"
              target="_blank"
              rel="noopener noreferrer"
              className="ym-legal-link"
            >
              listen on Spotify
            </a>
            .
          </p>
        </section>

        <section className="ym-about-office">
          <h2>Our office</h2>
          <p>
            Yellow Fintech Pvt Ltd
            <br />
            #677, 27th main, 13th cross, sector 1, HSR Layout, Bangalore 560102
          </p>
          <p>
            <a href="tel:+919090976076" className="ym-legal-link">
              ☎️ 90909 76076
            </a>
            <br />
            <a href="mailto:contact@yellowmetal.co" className="ym-legal-link">
              📮 contact@yellowmetal.co
            </a>
          </p>
          <p>
            <Link href="/contact" className="ym-legal-link">
              View all branch locations →
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
