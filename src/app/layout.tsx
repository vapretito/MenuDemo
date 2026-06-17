import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const SITE_URL = "https://www.menui.online";
const FAVICON_PATH = "/logos/menui-logo-purple.png";
const SOCIAL_IMAGE_PATH = "/logos/menui-logo-purple.png";

export const metadata: Metadata = {
  title: "Menui | Menu mobile para restaurantes",
  description:
    "Plataforma SaaS para restaurantes con menu mobile-first, carrito por WhatsApp, panel admin y superadmin con suscripciones en Mercado Pago.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      {
        url: FAVICON_PATH,
        type: "image/png",
      },
    ],
    shortcut: [FAVICON_PATH],
    apple: [FAVICON_PATH],
  },
  openGraph: {
    title: "Menui | Menu mobile para restaurantes",
    description:
      "Plataforma SaaS para restaurantes con menu mobile-first, carrito por WhatsApp, panel admin y superadmin con suscripciones en Mercado Pago.",
    url: SITE_URL,
    siteName: "Menui",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: SOCIAL_IMAGE_PATH,
        width: 1254,
        height: 1254,
        alt: "Logo de Menui",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Menui | Menu mobile para restaurantes",
    description:
      "Plataforma SaaS para restaurantes con menu mobile-first, carrito por WhatsApp, panel admin y superadmin con suscripciones en Mercado Pago.",
    images: [SOCIAL_IMAGE_PATH],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Menui",
    url: SITE_URL,
    logo: `${SITE_URL}${FAVICON_PATH}`,
  };

  return (
    <html lang="es">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify(organizationSchema)}
        </Script>
        {META_PIXEL_ID ? (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${META_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>

            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        ) : null}

        {children}
      </body>
    </html>
  );
}
