import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { TransactionProvider } from "@/context/TransactionContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DIAMOND Finance AI - Premium Personal Finance Assistant",
  description: "AI-powered Personal Finance Assistant for tracking transactions automatically, smart budgeting, and analytics.",
  appleWebApp: {
    capable: true,
    title: "DIAMOND",
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" translate="no" suppressHydrationWarning className={`${inter.variable} h-full antialiased`} style={{ colorScheme: 'light' }}>
      <body className="min-h-full flex flex-col">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <AuthProvider>
            <TransactionProvider>
              {children}
            </TransactionProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
