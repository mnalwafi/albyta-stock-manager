import type { Metadata, Viewport } from "next"; // Import Viewport
import { Inter } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MainLayout } from "@/components/MainLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ngatur Stock",
  description: "Manage your business inventory and finance.",
  manifest: "/manifest.json",
  icons: {
    icon: "/ngatur-stock-logo.png", // Adds favicon
    apple: "/ngatur-stock-logo.png", // Adds iOS icon support
  }
};

// Add Viewport settings to prevent zooming on mobile inputs
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50`}>
        {/* Use the Wrapper here */}
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}