import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getDirection } from "@/lib/i18n/config";
import { LocaleProvider } from "@/lib/i18n/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "Houseiana — Create Listing",
  description: "List your property on Houseiana",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const dir = getDirection(locale);

  return (
    <ClerkProvider>
      <html
        lang={locale}
        dir={dir}
        className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <LocaleProvider initialLocale={locale} initialDict={dict}>
            {children}
          </LocaleProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
