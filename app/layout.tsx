import type { Metadata } from "next";
import { Figtree, Zilla_Slab } from "next/font/google";
import { Navbar } from "./components/navbar";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-figtree",
});

const zillaSlab = Zilla_Slab({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-zilla-slab",
});

export const metadata: Metadata = {
  title: "Jingdex",
  description: "Learn Chinese with Jingdex.",
  icons: {
    icon: "/logos/logo_square.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${figtree.variable} ${zillaSlab.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
