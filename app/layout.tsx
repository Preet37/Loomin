import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loomin Control Deck",
  description: "Backend API Tester",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}