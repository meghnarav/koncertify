import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Koncertify — Live Event Ticketing",
  description:
    "Book tickets to the world's biggest live events. Fast, secure, and fair — powered by a high-concurrency distributed booking engine.",
  keywords: ["concert tickets", "live events", "ticketing", "music festivals"],
  openGraph: {
    title: "Koncertify — Live Event Ticketing",
    description: "Book tickets to the world's biggest live events.",
    type: "website",
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
