import type { Metadata } from "next";
import {
  Figtree,
  Noto_Sans_SC,
  Noto_Sans_TC,
  Zilla_Slab,
} from "next/font/google";
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

const notoSansSc = Noto_Sans_SC({
  weight: ["400", "700"],
  variable: "--font-noto-sans-sc",
});

const notoSansTc = Noto_Sans_TC({
  weight: ["400", "700"],
  variable: "--font-noto-sans-tc",
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
    <html
      lang="en"
      className={`${figtree.variable} ${zillaSlab.variable} ${notoSansSc.variable} ${notoSansTc.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
