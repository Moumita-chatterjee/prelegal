import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import AuthNav from "@/components/layout/AuthNav";

export const metadata: Metadata = {
  title: "Prelegal Document Creator",
  description: "Chat with an AI assistant to draft and download a completed legal agreement.",
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
