import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parametric Cable Engine | Cable Design Platform",
  description: "Automate low and medium-voltage power cable design with IS 7098 and IS 8130 compliance.",
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
