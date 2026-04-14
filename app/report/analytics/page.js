"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const ChatbotPopup = dynamic(() => import('@/components/ChatbotPopup'), { ssr: false });
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, AreaChart, Area
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Battery, Zap, Clock } from 'lucide-react';
import Footer from "@/src/components/Footer";

const TopNavigationBar = dynamic(() => import('@/components/TopNavigationBar'), { 
  ssr: false,
  loading: () => <div className="h-16 w-full animate-pulse bg-slate-100 rounded-full mb-6" /> 
});

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("device") || "9";

  const [rawData, setRawData] = useState({ points: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date("2026-03-13"));
  const [viewRange, setViewRange] = useState("day");
  
  const deviceId = useMemo(() => {
      if (rawId === "1") return "device1"; // Match your custom route logic
      if (rawId === "9") return "sapna_charger";
      const num = parseInt(rawId);
      if (num >= 2 && num <= 8) return `device${num}`;
      return rawId;
    }, [rawId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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
        
        if (response.ok) {
          setRawData(result);
          if (result.points && result.points.length > 0) {
            const validPoints = result.points.filter(p => !p.datetime.startsWith("1970"));
            const target = validPoints.length > 0 ? validPoints[validPoints.length - 1] : result.points[0];
            setSelectedDate(new Date(target.datetime));
          }
        }
      } catch (error) {
        console.error("Data Load Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [deviceId]);

  const processed = useMemo(() => {
    const allPoints = rawData.points || [];
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);
    const targetTime = targetDate.getTime();

    const filtered = allPoints.filter(p => {
      const pDate = new Date(p.datetime);
      if (pDate.getFullYear() < 2000) return false;

      const current = new Date(pDate);
      current.setHours(0, 0, 0, 0);
      const currentTime = current.getTime();

      if (viewRange === "day") return currentTime === targetTime;
      if (viewRange === "week") {
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - 7);
        return pDate >= startOfWeek && pDate <= new Date(targetDate).setHours(23, 59, 59);
      }
      if (viewRange === "month") {
        return pDate.getMonth() === targetDate.getMonth() && pDate.getFullYear() === targetDate.getFullYear();
      }
      return true;
    });

    if (filtered.length === 0) return { chartData: [], sessionData: [], hasData: false, totalKwh: "0.000", unit: "kWh", sessionUnit: "kWh" };

    const chartData = filtered.map((item) => ({
      ...item,
      displayTime: viewRange === "day" 
        ? item.datetime?.split('T')[1]?.substring(0, 5)
        : `${new Date(item.datetime).getDate()}/${new Date(item.datetime).getMonth() + 1} ${item.datetime?.split('T')[1]?.substring(0, 5)}`,
      current: parseFloat(item.current) || 0,
      voltage: parseFloat(item.voltage_inlet || item.voltage) || 0, 
      soc: parseFloat(item.soc) || 0
    }));

    const GAP_LIMIT = 30 * 60 * 1000;
    const CURRENT_THRESHOLD = 1;

    // Calculate energy using I × V × Δt / 3600 per interval (handles variable sample rates)
    const calcEnergyWh = (points) => {
      let wh = 0;
      for (let i = 1; i < points.length; i++) {
        const dtSec = (new Date(points[i].datetime) - new Date(points[i - 1].datetime)) / 1000;
        const current = parseFloat(points[i].current) || 0;
        const voltage = parseFloat(points[i].voltage_inlet || points[i].voltage) || 360;
        if (dtSec <= GAP_LIMIT / 1000) wh += current * voltage * dtSec / 3600;
      }
      return Math.max(0, wh);
    };

    const sessions = [];
    let currentSessionPoints = [];

    filtered.forEach((p, index) => {
      if (index === 0) {
        currentSessionPoints.push(p);
      } else {
        const prevTime = new Date(filtered[index - 1].datetime).getTime();
        const currTime = new Date(p.datetime).getTime();
        const prevCurrent = parseFloat(filtered[index - 1].current) || 0;
        const currCurrent = parseFloat(p.current) || 0;
        // Session break: time gap OR current drops from active to ~0
        const sessionBreak = (currTime - prevTime > GAP_LIMIT) ||
          (prevCurrent >= CURRENT_THRESHOLD && currCurrent < CURRENT_THRESHOLD);
        if (sessionBreak) {
          sessions.push({ name: `Sess ${sessions.length + 1}`, kwh: calcEnergyWh(currentSessionPoints) / 1000 });
          currentSessionPoints = [p];
        } else {
          currentSessionPoints.push(p);
        }
      }
    });

    if (currentSessionPoints.length > 0) {
      sessions.push({ name: `Sess ${sessions.length + 1}`, kwh: calcEnergyWh(currentSessionPoints) / 1000 });
    }

    const maxSession = Math.max(...sessions.map(s => s.kwh), 0);
    const sessionChartUnit = maxSession < 1 ? "Wh" : "kWh";
    const normalizedSessions = sessions.map(s => ({
      ...s,
      energy: sessionChartUnit === "Wh" ? s.kwh * 1000 : s.kwh
    }));

    const totalKwhValue = sessions.reduce((acc, curr) => acc + curr.kwh, 0);
    let displayValue = totalKwhValue < 1 ? (totalKwhValue * 1000).toFixed(2) : totalKwhValue.toFixed(3);
    let displayUnit = totalKwhValue < 1 ? "Wh" : "kWh";

    return { chartData, sessionData: normalizedSessions, sessionUnit: sessionChartUnit, hasData: true, totalKwh: displayValue, unit: displayUnit };
  }, [rawData, selectedDate, viewRange]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <p className="text-gray-400 font-medium animate-pulse">Loading analytics for Device {rawId}...</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopNavigationBar onDateChange={setSelectedDate} onRangeChange={setViewRange} exportId="analytics-report-area" showChat={false} />
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div id="analytics-report-area" className="space-y-8">

            {/* Page heading + energy summary */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Charger Analytics</h1>
                <p className="text-gray-600 text-sm sm:text-base">Real-time performance monitoring for Device {rawId}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium">ID: ZIP-UNIT-0{rawId}</Badge>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium">
                    {deviceId === "sapna_charger" ? "Okhla Phase III" : "Remote Unit"}
                  </Badge>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 min-w-[220px]">
                <p className="text-xs font-medium text-gray-500 mb-1">Total Energy Consumed</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  {processed.totalKwh} <span className="text-base font-normal text-gray-400">{processed.unit}</span>
                </p>
              </div>
            </div>

            {/* Chart cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Current Output (Amperes)"      data={processed.chartData}   dataKey="current" color="#3B82F6" icon={<Activity size={20} />} iconBg="bg-blue-500/10"   iconColor="text-blue-600"   hasData={processed.hasData} viewRange={viewRange} />
              <ChartCard title="Inlet Voltage (V)"             data={processed.chartData}   dataKey="voltage" color="#8B5CF6" icon={<Zap size={20} />}      iconBg="bg-purple-500/10" iconColor="text-purple-600" hasData={processed.hasData} viewRange={viewRange} />
              <ChartCard title="Battery Health (SoC %)"        data={processed.chartData}   dataKey="soc"     color="#10B981" icon={<Battery size={20} />}  iconBg="bg-green-500/10"  iconColor="text-green-600"  hasData={processed.hasData} isArea viewRange={viewRange} />
              <ChartCard title="Energy Consumed per Session"   data={processed.sessionData} dataKey="energy"  color="#6366f1" icon={<Clock size={20} />}    iconBg="bg-indigo-500/10" iconColor="text-indigo-600" hasData={processed.hasData} isBar unit={processed.sessionUnit} viewRange={viewRange} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ChatbotPopup deviceId={rawId} />
    </div>
  );
}

export default function Analytics() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400 font-medium animate-pulse">Loading Analytics...</p>
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  );
}

function ChartCard({ title, data, dataKey, color, icon, iconBg, iconColor, hasData, isArea = false, isBar = false, unit = "", viewRange = "day" }) {
  return (
    <Card className="rounded-2xl shadow-lg border border-gray-100 h-[420px] bg-white flex flex-col p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center mb-6 justify-between">
        <div className="flex items-center gap-3">
          <div className={`${iconBg} ${iconColor} p-2.5 rounded-xl`}>{icon}</div>
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
        </div>
        {isBar && hasData && <Badge variant="secondary" className="text-xs font-medium text-gray-500 bg-gray-100">Unit: {unit}</Badge>}
      </div>
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          {isArea ? (
            <AreaChart data={data} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayTime" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b', angle: -45, textAnchor: 'end' }} height={70} interval={viewRange === "day" ? 4 : "preserveStartEnd"} axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
              <Tooltip />
              <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.1} strokeWidth={3} />
            </AreaChart>
          ) : isBar ? (
            <BarChart data={data} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10}/>
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
              <Tooltip formatter={(val) => [`${val.toFixed(2)} ${unit}`, "Energy"]} />
              <Bar dataKey={dataKey} fill={color} radius={[8, 8, 8, 8]} barSize={60} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayTime" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b', angle: -45, textAnchor: 'end' }} height={70} interval={viewRange === "day" ? 4 : "preserveStartEnd"} axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}