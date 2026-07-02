import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jingdex",
  description: "Learn Chinese with Jingdex.",
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
