import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import AuthNav from "@/components/layout/AuthNav";

export const metadata: Metadata = {
  title: "Mutual NDA Creator",
  description: "Create and download a completed Mutual Non-Disclosure Agreement.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <AuthNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
