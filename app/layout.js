"use client"; // Important if you're using state/hooks here
import { useState, useEffect } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ClerkProvider } from "@clerk/nextjs";

// Import the contents
import DashboardContent from "@/app/dashboard/page";
import AnalyticsContent from "@/app/analytics/page";
import ReportsContent from "@/app/reports/page";

export default function RootLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="bg-gray-200" suppressHydrationWarning>
          <div className="flex"> 
            <Sidebar />
            <main className="flex-1 ml-20">{children}</main>
          </div>

          {/* Only render the print engine on the client after mount */}
          {mounted && (
            <div style={{ position: "absolute", top: "-20000px", left: "-20000px", width: "1200px" }}>
              <div id="master-pdf-export-container">
                {/* Notice the 'print-' prefix added to these IDs */}
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