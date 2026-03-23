import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CustomThemeApplier } from "@/components/custom-theme-applier";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "PEEL Detective",
    template: "%s | PEEL Detective",
  },
  description:
    "Solve crime mysteries and master structured writing with AI-powered PEEL feedback. An educational detective game for students.",
  keywords: [
    "PEEL writing",
    "detective",
    "education",
    "AI feedback",
    "structured writing",
    "mystery",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "PEEL Detective",
    title: "PEEL Detective",
    description:
      "Solve the Mystery. Master Your Writing. AI-powered PEEL writing feedback through detective mysteries.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PEEL Detective",
    description:
      "Solve the Mystery. Master Your Writing. AI-powered PEEL writing feedback through detective mysteries.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PEEL Detective",
  description:
    "Solve crime mysteries and master structured writing with AI-powered PEEL feedback.",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CustomThemeApplier />
          <TooltipProvider>
            <SiteHeader />
            <main id="main-content">{children}</main>
            <SiteFooter />
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
