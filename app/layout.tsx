import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jingdex",
  description: "Learn Chinese with Jingdex.",
  icons: {
    icon: "/logos/logo_square.svg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
