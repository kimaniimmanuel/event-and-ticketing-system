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

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3210";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Tikiti — Discover & host free events",
    template: "%s · Tikiti",
  },
  description:
    "A centralized platform to discover, register for, and host free events, with digital QR tickets.",
  openGraph: {
    siteName: "Tikiti",
    type: "website",
    title: "Tikiti — Discover & host free events",
    description:
      "A centralized platform to discover, register for, and host free events, with digital QR tickets.",
  },
  twitter: {
    card: "summary_large_image",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
