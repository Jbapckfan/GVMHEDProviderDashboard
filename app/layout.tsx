import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GVMHED Provider Dashboard",
  description: "Dashboard for ED Providers to access information quickly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
