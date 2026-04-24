"use client";
import { useState, useEffect, lazy, Suspense } from "react";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import SyncUser from "@/components/SyncUser";

// Only loaded when PDF export is actually triggered, not on every page
const DashboardContent = dynamic(() => import("@/app/stations/dashboard/page"), { ssr: false });
const AnalyticsContent = dynamic(() => import("@/app/analytics/page"), { ssr: false });
const ReportsContent   = dynamic(() => import("@/app/reports/page"), { ssr: false });

export default function RootLayout({ children }) {
  const [pdfReady, setPdfReady] = useState(false);

  useEffect(() => {
    // Mount PDF containers only when a PDF export is requested
    const handler = () => setPdfReady(true);
    window.addEventListener("prepare-pdf-export", handler);
    return () => window.removeEventListener("prepare-pdf-export", handler);
  }, []);

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="bg-[#F8FAFC]" suppressHydrationWarning>
          <SyncUser />
          <main className="min-h-screen w-full">
            {children}
          </main>

          {pdfReady && (
            <div
              style={{
                position: "absolute",
                top: "-20000px",
                left: "-20000px",
                width: "1200px",
                pointerEvents: "none",
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