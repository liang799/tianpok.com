import type { Metadata } from "next";
import { anton, inter } from "./fonts";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { site } from "@/lib/seo";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: "%s | Tian Pok",
  },
  description: site.description,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
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
