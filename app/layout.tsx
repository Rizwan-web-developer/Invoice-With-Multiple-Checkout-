import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InvoicePro - Professional Invoice Management",
  description: "Create, manage, and send invoices with multiple payment gateways",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
