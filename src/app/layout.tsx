import type { Metadata, Viewport } from "next";
import { brandFont, displayFont } from "@/lib/fonts";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import "./globals.css";
import "./site.css";

export const metadata: Metadata = {
  title: "Yellow Metal — Gold Loans with no hidden fees",
  description:
    "Gold loans with no hidden fees. Transparent IBJA rates, insured storage, and UPI disbursement from Yellow Metal.",
  applicationName: "Yellow Metal",
};

export const viewport: Viewport = {
  themeColor: "#000000",
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
      <body className={`min-h-dvh ${displayFont.className}`}>
        <div className="ym-site">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
