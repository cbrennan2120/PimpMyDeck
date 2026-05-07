import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pimp My Deck",
  description: "A visual-first Magic: The Gathering deck pimping tool.",
  other: {
    "impact-site-verification": "10b0db31-dca2-4612-aa23-b1a3500cb176",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <Script
        id="impact-tracking"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html:
            "(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})(\"https://utt.impactcdn.com/P-A7277244-2e27-4e2d-820c-87e76f37dae01.js\",\"script\",\"impactStat\",document,window);impactStat(\"transformLinks\");impactStat(\"trackImpression\");",
        }}
      />
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
