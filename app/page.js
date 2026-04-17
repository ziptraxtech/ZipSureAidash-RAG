"use client";

import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import dynamic from "next/dynamic";

const StatsCards = dynamic(() => import("@/src/components/StatsCards"), {
  ssr: false,
  loading: () => <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}</div>
});
const RealTimeIndicators = dynamic(() => import("@/src/components/RealTimeIndicators"), { ssr: false });
const ChartsComponent = dynamic(() => import("@/src/components/ChartsComponent"), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-200 rounded-2xl animate-pulse mb-6" />
});
const MapComponent = dynamic(() => import("@/src/components/MapComponent"), { ssr: false });

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50 text-slate-800">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Overview</h1>
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
