import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { brandFont, displayFont } from "@/lib/fonts";
import { AnalyticsBeacon } from "@/components/analytics-beacon";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import "./globals.css";
import "./site.css";

export const metadata: Metadata = {
  title: "Yellow Metal, Gold Loans in 10 mins with no hidden charges",
  description:
    "Gold Loans in 10 mins with no hidden charges and Insured gold storage. Regular reminders and app to track your loans and jewels",
  applicationName: "Yellow Metal",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${brandFont.variable} ${displayFont.variable}`}
    >
      <head>
        <link
          rel="preload"
          href="/fonts/inter-latin-600.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`min-h-dvh ${displayFont.className}`}>
        <div className="ym-site">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <Suspense fallback={null}>
            <AnalyticsBeacon />
          </Suspense>
        </div>
      </body>
    </html>
  );
}
