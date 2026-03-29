"use client";

import Header from "@/src/components/Header";
import Reports from "@/src/components/Reports";
import Footer from "@/src/components/Footer";

export default function ReportPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Reports />
      </main>
      <Footer />
    </div>
  );
}
