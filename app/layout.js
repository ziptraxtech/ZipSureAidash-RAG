import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FaHome, FaChartBar, FaTable } from "react-icons/fa";
import Sidebar from "@/components/Sidebar";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Zipsure AI",
  description: "Zipsure AI",
};

// Moving these inside a component or keeping them here is fine, 
// but ensure Sidebar is client-safe.

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="bg-gray-200" suppressHydrationWarning>
          <div className="flex"> 
            <Sidebar />
            <main className="flex-1 ml-20">
              {children}
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}