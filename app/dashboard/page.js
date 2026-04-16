"use client";

import Header from "@/src/components/Header";
import StatsCards from "@/src/components/StatsCards";
import RealTimeIndicators from "@/src/components/RealTimeIndicators";
import ChartsComponent from "@/src/components/ChartsComponent";
import dynamic from "next/dynamic";
const MapComponent = dynamic(() => import("@/src/components/MapComponent"), { ssr: false });
import Footer from "@/src/components/Footer";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50 text-slate-800">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Dashboard Overview</h1>
            <p className="text-gray-600 text-sm sm:text-base">Monitor and manage your EV charging stations in real-time</p>
          </div>

          <StatsCards />
          <RealTimeIndicators />
          <ChartsComponent />
          <MapComponent />
        </div>
      </main>
      <Footer />
    </div>
  );
}
