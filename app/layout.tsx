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
  openGraph: {
    title: "votemap",
    description: "democratize everything. vote for the future you want to see.",
    url: "https://votemap.net",
    siteName: "votemap",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "votemap",
    description: "democratize everything. vote for the future you want to see.",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
