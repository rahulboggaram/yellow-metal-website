import type { Metadata, Viewport } from "next";
import { brandFont } from "@/lib/fonts";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import "./globals.css";
import "./site.css";

export const metadata: Metadata = {
  title: "Yellow Metal — Gold Loans with no hidden charges",
  description:
    "Get a gold loan from Yellow Metal. Transparent rates, insured storage, UPI disbursement, and no hidden charges.",
  applicationName: "Yellow Metal",
};

export const viewport: Viewport = {
  themeColor: "#d4af37",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${brandFont.variable}`}>
      <body className="min-h-dvh">
        <div className="ym-site">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
