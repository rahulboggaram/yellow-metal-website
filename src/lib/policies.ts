export type SitePolicy = {
  href: string;
  label: string;
  description: string;
};

/** Add new policies here — they appear on /policies and can be linked from the footer. */
export const SITE_POLICIES: SitePolicy[] = [
  {
    href: "/privacy",
    label: "Privacy policy",
    description:
      "How Yellow Metal Loans collects, uses, stores, and shares your personal information.",
  },
  {
    href: "/terms",
    label: "Terms & conditions",
    description:
      "Terms governing access to and use of the Yellow Metal website.",
  },
];
