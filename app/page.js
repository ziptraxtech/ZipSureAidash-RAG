"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, Battery, Zap, TrendingUp, 
  Clock, Gauge, MapPin 
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useSearchParams } from "next/navigation"; 

// Dynamic Imports
const TopNavigationBar = dynamic(() => import('@/components/TopNavigationBar'), { 
  ssr: false,
  loading: () => <div className="h-20 w-full animate-pulse bg-blue-600/20" /> 
});
const ChargerMap = dynamic(() => import('@/components/MapComponent'), { ssr: false });

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
        const apiUrl = deviceId === "sapna_charger" 
          ? "/api/sapna_charger" 
          : `/api/charger_data?device=${deviceId}`;

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

    // Session Calculation (Gap Logic handles 0.00A)
    let totalSessionMs = 0;
    const GAP_LIMIT = 600000; 
    let segmentStart = new Date(filtered[0].datetime).getTime();
    let lastSeenTime = segmentStart;

    for (let i = 1; i < filtered.length; i++) {
      const currentTime = new Date(filtered[i].datetime).getTime();
      if (currentTime - lastSeenTime > GAP_LIMIT) {
        totalSessionMs += (lastSeenTime - segmentStart);
        segmentStart = currentTime;
      }
      lastSeenTime = currentTime;
    }
    totalSessionMs += (lastSeenTime - segmentStart);

    const h = String(Math.floor(totalSessionMs / 3600000)).padStart(2, '0');
    const m = String(Math.floor((totalSessionMs % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((totalSessionMs % 60000) / 1000)).padStart(2, '0');

    // Correct Energy Delta Logic
    const firstPoint = filtered[0];
    const lastPoint = filtered[filtered.length - 1];
    const deltaWh = Math.max(0, (lastPoint.energy || 0) - (firstPoint.energy || 0));
    
    const energyDisplayValue = deltaWh < 1000 
      ? `${deltaWh.toFixed(2)} Wh` 
      : `${(deltaWh / 1000).toFixed(2)} kWh`;

    const isOnline = (new Date() - new Date(lastPoint.datetime)) / 1000 < 900;

    return {
      lastCurrent: (lastPoint.current || 0).toFixed(2),
      soh: "92.2", 
      lastVoltage: lastPoint.voltage_inlet || 230,
      endEnergy: energyDisplayValue,
      sessionTime: `${h}:${m}:${s}`,
      lastSeen: formatLastSync(lastPoint.datetime),
      isOnline,
      sparkline: filtered.slice(-10).map(p => ({ value: p.current || 0 })),
      counts: {
        online: isOnline ? 1 : 0,
        offline: !isOnline ? 1 : 0,
        charging: (isOnline && (lastPoint.current || 0) > 0.1) ? 1 : 0,
        maintenance: 0
      }
    };
  }, [rawData, hasMounted, selectedDate, viewRange]);

  if (!hasMounted) return null;

  const stats = [
    { title: 'State of Health', value: metrics ? `${metrics.soh}%` : '--', icon: <Battery size={20} />, trend: '+0.2%', color: 'emerald', lineColor: '#10b981', data: [{v:88},{v:89},{v:88},{v:90}] },
    { title: 'Last Current', value: metrics ? `${metrics.lastCurrent} A` : '--', icon: <Activity size={20} />, trend: 'Live', color: 'blue', lineColor: '#3b82f6', data: metrics?.sparkline || [] },
    { title: 'Last Voltage', value: metrics ? `${metrics.lastVoltage} V` : '--', icon: <Zap size={20} />, trend: 'Stable', color: 'purple', lineColor: '#8b5cf6', data: [{v:230},{v:235},{v:237},{v:237}] },
    { title: 'Energy Consumed', value: metrics ? metrics.endEnergy : '--', icon: <Gauge size={20} />, trend: 'Total', color: 'cyan', lineColor: '#06b6d4', data: [{v:0.1},{v:0.2},{v:0.3},{v:0.38}] },
    { title: 'Session Time', value: metrics ? metrics.sessionTime : '--:--:--', icon: <Clock size={20} />, trend: 'Active', color: 'orange', lineColor: '#f59e0b', data: [{v:10},{v:12},{v:15},{v:17}] },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <TopNavigationBar onDateChange={setSelectedDate} onRangeChange={setViewRange} exportId="analytics-report-area" />
      <main className="p-8 max-w-[1600px] mx-auto">
        <div id="analytics-report-area" className="space-y-8">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Dashboard Overview</h2>
              <p className="text-slate-500 font-medium">Monitor EV charging stations in real-time</p>
            </div>
            <Badge variant="outline" className="bg-white px-4 py-2 border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm">
              {metrics ? `LAST SYNC: ${metrics.lastSeen}` : "OFFLINE"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {stats.map((stat, i) => (
              <Card key={i} className="p-6 rounded-[2rem] border-none shadow-xl bg-white flex flex-col justify-between hover:scale-[1.02] transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${
                    stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
                    stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                    stat.color === 'purple' ? 'bg-purple-50 text-purple-600' : 
                    stat.color === 'cyan' ? 'bg-cyan-50 text-cyan-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {stat.icon}
                  </div>
                  <div className="flex items-center text-[10px] font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-500 uppercase tracking-tighter">
                    <TrendingUp size={10} className="mr-1" /> {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                  <div className="h-10 mt-3 -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stat.data}>
                        <Line type="monotone" dataKey={stat.data[0]?.v !== undefined ? "v" : "value"} stroke={stat.lineColor} strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <Card className="lg:col-span-1 rounded-[2.5rem] border-none shadow-2xl bg-white flex flex-col">
              <div className="p-6 border-b border-slate-50 flex items-center bg-slate-50/50 h-[88px]">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                  Real-Time Occupancy
                </h3>
              </div>
              <div className="p-8 flex-grow">
                <div className="grid grid-cols-2 gap-4">
                  <StatusTile label="Online" count={metrics?.counts?.online} color="emerald" />
                  <StatusTile label="Offline" count={metrics?.counts?.offline} color="rose" />
                  <StatusTile label="Charging" count={metrics?.counts?.charging} color="blue" />
                  <StatusTile label="Maintenance" count={0} color="amber" />
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 h-[88px]">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2.5 rounded-2xl text-white">
                    <MapPin size={16} />
                  </div>
                  <span className="text-xl font-black text-slate-900 uppercase tracking-widest">Device Location</span>
                </div>
              </div>
              <div className="h-[400px] relative">
                <ChargerMap deviceId={rawId} />
              </div>
            </Card>
          </div>
        </div>
      </main>
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
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };
  return (
    <div className={`p-6 rounded-[2rem] border ${colors[color]} flex flex-col items-center justify-center transition-all hover:shadow-md`}>
      <span className="text-[10px] font-black uppercase tracking-tighter mb-1 opacity-70">{label}</span>
      <span className="text-4xl font-black tracking-tighter">{count ?? 0}</span>
    </div>
  );
}