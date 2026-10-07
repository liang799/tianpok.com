import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL("https://tianpok.com"),
  title: {
    default: "Tian Pok — Ideas Under Construction",
    template: "%s | Tian Pok",
  },
  description:
    "Tian Pok — a developer and builder of digital things. A collection of projects, experiments, and ideas in software engineering and product design.",
  openGraph: {
    title: "Tian Pok — Ideas Under Construction",
    description:
      "A collection of projects, experiments, and ideas. Still learning. Still building.",
    type: "website",
    locale: "en_SG",
    siteName: "Tian Pok",
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${anton.variable} antialiased`}
    >
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
