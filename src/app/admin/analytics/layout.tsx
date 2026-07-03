import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics admin — Yellow Metal",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AnalyticsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
