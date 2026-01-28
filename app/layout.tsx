import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "votemap",
  description: "democratize everything. vote for the future you want to see.",
  keywords: ["votemap", "democratize", "voting", "future", "collective decision making"],
  authors: [{ name: "OneX Engineering" }],
  alternates: {
    canonical: "https://votemap.net",
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "votemap",
    description: "democratize everything. vote for the future you want to see.",
    url: "https://votemap.net",
    siteName: "votemap",
    type: "website",
    images: [
      {
        url: "/images/votemap_light.JPG",
        alt: "votemap",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "votemap",
    description: "democratize everything. vote for the future you want to see.",
    images: ["/images/votemap_light.JPG"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "votemap",
              "url": "https://votemap.net",
              "description": "democratize everything. vote for the future you want to see.",
              "publisher": {
                "@type": "Organization",
                "name": "OneX Engineering",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
