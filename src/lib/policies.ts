export type SitePolicy = {
  href: string;
  label: string;
};

/** Add new policies here — they appear on /policies and can be linked from the footer. */
export const SITE_POLICIES: SitePolicy[] = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms & conditions" },
  { href: "/fair-practices", label: "Fair Practices Code" },
  {
    href: "/policies/grievance-redressal",
    label: "Grievance Redressal",
  },
];
