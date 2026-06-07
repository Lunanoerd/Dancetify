import type { Metadata, Viewport } from "next";
import { Nunito, Unbounded } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import { TabBar } from "@/components/TabBar";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800"],
});

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Dancetify — London Dance Classes",
  description: "Find and book dance classes across London's top studios in one place.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${nunito.variable} ${unbounded.variable} h-full antialiased`}>
        <body className="min-h-full">
          {children}
          <TabBar />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
