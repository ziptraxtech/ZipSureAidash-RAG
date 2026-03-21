"use client";
import { useState, useEffect } from "react";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

// Keep these for your background PDF generation logic
import DashboardContent from "@/app/dashboard/page";
import AnalyticsContent from "@/app/analytics/page";
import ReportsContent from "@/app/reports/page";

export default function RootLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Corrected: Set to true so the hidden PDF container can render after hydration
    setMounted(true);
  }, []);

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="bg-[#F8FAFC]" suppressHydrationWarning>
          {/* Removed 'flex' and 'ml-20'. 
              The page now takes up 100% width since the sidebar is gone.
          */}
          <main className="min-h-screen w-full">
            {children}
          </main>

          {/* Hidden container for PDF Generation */}
          {mounted && (
            <div 
              style={{ 
                position: "absolute", 
                top: "-20000px", 
                left: "-20000px", 
                width: "1200px",
                pointerEvents: "none" 
              }}
            >
              <div id="master-pdf-export-container">
                <div id="print-dashboard"><DashboardContent /></div>
                <div id="print-analytics"><AnalyticsContent /></div>
                <div id="print-reports"><ReportsContent /></div>
              </div>
            </div>
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}