import { baseUrl, createMetadata } from "@/lib/metadata";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./global.css";

export const metadata = createMetadata({
  title: {
    template: "%s | DeesseJS Collections",
    default: "DeesseJS Collections",
  },
  description: "Type-safe collections with plugins, i18n, and auto-generated APIs. The functional-first data layer for modern TypeScript applications",
  metadataBase: baseUrl,
});

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
    { media: "(prefers-color-scheme: light)", color: "#fff" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
