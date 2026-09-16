import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/store/cart-store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { db } from "@/db";
import { siteSettings, heroSettings } from "@/db/schema";
import { getSession } from "@/lib/auth";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sushre — Premium Women's Fashion in Bangladesh",
    template: "%s | Sushre",
  },
  description:
    "Saree, three-piece, kurti, hijab & festive wear. Cash on delivery across Bangladesh. Premium quality, honest prices.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Sushre — Elegance Daily",
    description: "Premium women's fashion, delivered across Bangladesh.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2e0b1d",
};

async function getShellData() {
  try {
    const [site] = await db.select().from(siteSettings).limit(1);
    const session = await getSession();
    return {
      announcement: site?.announcementEnabled ? site?.announcementText : null,
      freeThreshold: site?.freeShippingThreshold ?? null,
      supportPhone: site?.supportPhone ?? null,
      user: session ? { name: session.name, role: session.role } : null,
    };
  } catch {
    return { announcement: null, freeThreshold: null, supportPhone: null, user: null };
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const shell = await getShellData();
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        {/* Google Tag Manager - Head Script */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-P8XXSH5V');
            `,
          }}
        />
      </head>
      <body className="min-h-screen">
        {/* Google Tag Manager (noscript) - Body Script */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-P8XXSH5V"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <CartProvider>
          <Header announcement={shell.announcement} user={shell.user} />
          <main className="min-h-[60vh]">{children}</main>
          <Footer supportPhone={shell.supportPhone} />
          <CartDrawer freeThreshold={shell.freeThreshold} />
        </CartProvider>
      </body>
    </html>
  );
}