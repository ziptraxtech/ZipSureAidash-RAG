"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import {
  Activity, Battery, Zap, TrendingUp,
  Clock, Gauge, MapPin, ArrowLeft
} from "lucide-react";
const LineChart     = dynamic(() => import('recharts').then(m => ({ default: m.LineChart })),     { ssr: false });
const Line          = dynamic(() => import('recharts').then(m => ({ default: m.Line })),          { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })), { ssr: false });
import { useSearchParams } from "next/navigation";
import Footer from "@/src/components/Footer";

const TopNavigationBar = dynamic(() => import('@/components/TopNavigationBar'), {
  ssr: false,
  loading: () => <div className="h-20 w-full animate-pulse bg-blue-600/20" />
});
const ChargerMap = dynamic(() => import('@/components/MapComponent'), { ssr: false });
const ChatbotPopup = dynamic(() => import('@/components/ChatbotPopup'), { ssr: false });

const formatLastSync = (dateString) => {
  if (!dateString) return "OFFLINE";
  const date = new Date(dateString);
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("device") || "9";

  const deviceId = useMemo(() => {
    if (rawId === "1") return "device1"; // Match your custom route logic
    if (rawId === "9") return "sapna_charger";
    const num = parseInt(rawId);
    if (num >= 2 && num <= 8) return `device${num}`;
    return rawId;
  }, [rawId]);
  
  const [rawData, setRawData] = useState({ points: [], metadata: {} });
  const [hasMounted, setHasMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date("2026-03-13"));
  const [viewRange, setViewRange] = useState("day");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setHasMounted(true);

        let apiUrl;
        if (deviceId === "device1") {
          apiUrl = "/api/charger_data_1"; // Your custom route for ID 1
        } else if (deviceId === "sapna_charger") {
          apiUrl = "/api/sapna_charger";
        } else {
          apiUrl = `/api/charger_data?device=${deviceId}`;
        }

        const response = await fetch(apiUrl);
        const result = await response.json();

        if (response.ok && result.points) {
          setRawData(result);
          const validPoints = result.points.filter(p => !p.datetime.startsWith("1970"));
          const targetPoint = validPoints.length > 0 ? validPoints[validPoints.length - 1] : result.points[0];
          if (targetPoint) setSelectedDate(new Date(targetPoint.datetime));
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };
    fetchData();
  }, [deviceId]);

  const metrics = useMemo(() => {
    const allPoints = rawData.points || [];
    if (!hasMounted || allPoints.length === 0) return null;
    
    const filtered = allPoints.filter(p => {
      const pDate = new Date(p.datetime);
      if (pDate.getFullYear() < 2000) return false; 

      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      const current = new Date(pDate);
      current.setHours(0, 0, 0, 0);

      if (viewRange === "day") return current.getTime() === selected.getTime();
      if (viewRange === "week") {
        const weekAgo = new Date(selected);
        weekAgo.setDate(selected.getDate() - 7);
        return pDate >= weekAgo && pDate <= new Date(selectedDate).setHours(23,59,59);
      }
      if (viewRange === "month") {
        return pDate.getMonth() === selected.getMonth() && pDate.getFullYear() === selected.getFullYear();
      }
      return true;
    });
    
    if (filtered.length === 0) return null;

    const CURRENT_THRESHOLD = 1;
    const GAP_LIMIT = 30 * 60 * 1000;

    const calcEnergyWh = (points) => {
      let wh = 0;
      for (let i = 1; i < points.length; i++) {
        const dtSec = (new Date(points[i].datetime) - new Date(points[i - 1].datetime)) / 1000;
        const curr = parseFloat(points[i].current) || 0;
        const volt = parseFloat(points[i].voltage_inlet || points[i].voltage) || 360;
        if (dtSec <= GAP_LIMIT / 1000) wh += curr * volt * dtSec / 3600;
      }
      return Math.max(0, wh);
    };

    // Build sessions, splitting on time gap OR current dropping to ~0
    let totalSessionMs = 0;
    let currentSessionPoints = [];

    filtered.forEach((p, index) => {
      if (index === 0) {
        currentSessionPoints.push(p);
      } else {
        const prevTime = new Date(filtered[index - 1].datetime).getTime();
        const currTime = new Date(p.datetime).getTime();
        const prevCurrent = parseFloat(filtered[index - 1].current) || 0;
        const currCurrent = parseFloat(p.current) || 0;
        const dtMs = currTime - prevTime;
        const sessionBreak = (dtMs > GAP_LIMIT) ||
          (prevCurrent >= CURRENT_THRESHOLD && currCurrent < CURRENT_THRESHOLD);

        if (sessionBreak) {
          currentSessionPoints = [p];
        } else {
          if (prevCurrent >= CURRENT_THRESHOLD && currCurrent >= CURRENT_THRESHOLD) {
            totalSessionMs += dtMs;
          }
          currentSessionPoints.push(p);
        }
      }
    });

    const h = String(Math.floor(totalSessionMs / 3600000)).padStart(2, '0');
    const m = String(Math.floor((totalSessionMs % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((totalSessionMs % 60000) / 1000)).padStart(2, '0');

    // Energy: sum across all sessions
    const sessions = [];
    let sessionPoints = [];
    filtered.forEach((p, index) => {
      if (index === 0) {
        sessionPoints.push(p);
      } else {
        const prevTime = new Date(filtered[index - 1].datetime).getTime();
        const currTime = new Date(p.datetime).getTime();
        const prevCurrent = parseFloat(filtered[index - 1].current) || 0;
        const currCurrent = parseFloat(p.current) || 0;
        const sessionBreak = (currTime - prevTime > GAP_LIMIT) ||
          (prevCurrent >= CURRENT_THRESHOLD && currCurrent < CURRENT_THRESHOLD);
        if (sessionBreak) {
          sessions.push(sessionPoints);
          sessionPoints = [p];
        } else {
          sessionPoints.push(p);
        }
      }
    });
    if (sessionPoints.length > 0) sessions.push(sessionPoints);

    const totalWh = sessions.reduce((acc, s) => acc + calcEnergyWh(s), 0);
    const energyDisplayValue = totalWh < 1000
      ? `${totalWh.toFixed(2)} Wh`
      : `${(totalWh / 1000).toFixed(2)} kWh`;

    const lastPoint = filtered[filtered.length - 1];
    const isOnline = (new Date() - new Date(lastPoint.datetime)) / 1000 < 900;

    return {
      lastCurrent: (lastPoint.current || 0).toFixed(2),
      soc: (lastPoint.soc || 0).toFixed(1),
      lastVoltage: lastPoint.voltage_inlet || 360,
      endEnergy: energyDisplayValue,
      sessionTime: `${h}:${m}:${s}`,
      lastSeen: formatLastSync(lastPoint.datetime),
      isOnline,
      sparkline: filtered.slice(-10).map(p => ({ value: p.current || 0 })),
      socSparkline: filtered.slice(-10).map(p => ({ value: parseFloat(p.soc) || 0 })),
      counts: {
        online: isOnline ? 1 : 0,
        offline: !isOnline ? 1 : 0,
        charging: (isOnline && (lastPoint.current || 0) > CURRENT_THRESHOLD) ? 1 : 0,
        maintenance: 0
      }
    };
  }, [rawData, hasMounted, selectedDate, viewRange]);

  const stats = useMemo(() => [
    { title: 'State of Charge',  value: metrics ? `${metrics.soc}%`          : '--',       icon: <Battery size={24} />, trend: 'Live',   trendUp: true,  gradient: 'from-green-500 to-green-600',  iconBg: 'bg-green-500/10',  lineColor: '#10b981', data: metrics?.socSparkline || [] },
    { title: 'Last Current',     value: metrics ? `${metrics.lastCurrent} A`  : '--',       icon: <Activity size={24} />, trend: 'Live',  trendUp: true,  gradient: 'from-blue-500 to-blue-600',   iconBg: 'bg-blue-500/10',   lineColor: '#3b82f6', data: metrics?.sparkline || [] },
    { title: 'Last Voltage',     value: metrics ? `${metrics.lastVoltage} V`  : '--',       icon: <Zap size={24} />,     trend: 'Stable', trendUp: true,  gradient: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-500/10', lineColor: '#8b5cf6', data: [{v:230},{v:235},{v:237},{v:237}] },
    { title: 'Energy Consumed',  value: metrics ? metrics.endEnergy           : '--',       icon: <Gauge size={24} />,   trend: 'Total',  trendUp: true,  gradient: 'from-cyan-500 to-cyan-600',   iconBg: 'bg-cyan-500/10',   lineColor: '#06b6d4', data: [{v:0.1},{v:0.2},{v:0.3},{v:0.38}] },
    { title: 'Session Time',     value: metrics ? metrics.sessionTime         : '--:--:--', icon: <Clock size={24} />,   trend: 'Active', trendUp: true,  gradient: 'from-amber-500 to-orange-600', iconBg: 'bg-amber-500/10',  lineColor: '#f59e0b', data: [{v:10},{v:12},{v:15},{v:17}] },
  ], [metrics]);

  if (!hasMounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopNavigationBar onDateChange={setSelectedDate} onRangeChange={setViewRange} exportId="analytics-report-area" showChat={false} />
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div id="analytics-report-area" className="space-y-8">
            {/* Back link */}
            <a
              href="/stations"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={15} />
              Back to Stations
            </a>

            {/* Page heading */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
                <p className="text-gray-600 text-sm sm:text-base">Monitor EV charging stations in real-time</p>
              </div>
              <span className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm self-start sm:self-auto">
                {metrics ? `Last sync: ${metrics.lastSeen}` : "Offline"}
              </span>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-gray-100">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className={`${stat.iconBg} p-2 sm:p-3 rounded-xl`}>
                      <div className={`bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className={`hidden sm:flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                      stat.trendUp ? 'text-green-700 bg-green-100' : 'text-amber-700 bg-amber-100'
                    }`}>
                      <TrendingUp size={12} className="mr-1" />
                      {stat.trend}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-1 sm:mb-2`}>
                    {stat.value}
                  </p>
                  <div className="h-8 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stat.data}>
                        <Line type="monotone" dataKey={stat.data[0]?.v !== undefined ? "v" : "value"} stroke={stat.lineColor} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>

            {/* Occupancy + Map */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
              <Card className="lg:col-span-1 rounded-2xl shadow-lg border border-gray-100 bg-white flex flex-col">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                  <h3 className="text-lg font-bold text-gray-900">Real-Time Occupancy</h3>
                </div>
                <div className="p-6 flex-grow">
                  <div className="grid grid-cols-2 gap-4">
                    <StatusTile label="Online"      count={metrics?.counts?.online}   color="emerald" />
                    <StatusTile label="Offline"     count={metrics?.counts?.offline}  color="rose" />
                    <StatusTile label="Charging"    count={metrics?.counts?.charging} color="blue" />
                    <StatusTile label="Maintenance" count={0}                         color="amber" />
                  </div>
                </div>
              </Card>

              <Card className="lg:col-span-2 rounded-2xl shadow-lg border border-gray-100 bg-white overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-600">
                    <MapPin size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Device Location</h3>
                </div>
                <div className="h-[400px] relative">
                  <ChargerMap deviceId={rawId} />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ChatbotPopup deviceId={rawId} />
    </div>
  );
}

// Main Page Export
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-bold text-slate-400 animate-pulse">INITIALIZING DASHBOARD...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

// Helper Component
function StatusTile({ label, count, color }) {
  const colors = {
    emerald: "bg-green-50 text-green-600 border-green-100",
    rose:    "bg-red-50 text-red-500 border-red-100",
    blue:    "bg-blue-50 text-blue-600 border-blue-100",
    amber:   "bg-amber-50 text-amber-600 border-amber-100",
  };
  return (
    <div className={`p-5 rounded-2xl border ${colors[color]} flex flex-col items-center justify-center transition-all hover:shadow-md`}>
      <span className="text-xs font-medium uppercase tracking-wide mb-1 opacity-70">{label}</span>
      <span className="text-3xl font-bold">{count ?? 0}</span>
    </div>
  );
}