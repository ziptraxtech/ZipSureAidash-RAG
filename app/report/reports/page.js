"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const ChatbotPopup = dynamic(() => import('@/components/ChatbotPopup'), { ssr: false });
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, Leaf, Zap, BarChart3, Activity } from 'lucide-react';
import Footer from "@/src/components/Footer";

const TopNavigationBar = dynamic(() => import('@/components/TopNavigationBar'), { 
  ssr: false,
  loading: () => <div className="h-16 w-full animate-pulse bg-slate-100 rounded-full mb-6" /> 
});

const TARIFF_RATE = 15; 
const COST_RATE = 5;    

function ReportsContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("device") || "9";

  const [reportData, setReportData] = useState({ metadata: {}, points: [] });
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
          apiUrl = "/api/charger_data_1";
        } else if (deviceId === "sapna_charger") {
          apiUrl = "/api/sapna_charger";
        } else {
          apiUrl = `/api/charger_data?device=${deviceId}`;
        }
        const response = await fetch(apiUrl);
        const result = await response.json();
        if (response.ok) {
          setReportData(result);
          if (result.points && result.points.length > 0) {
            const validPoints = result.points.filter(p => !p.datetime.startsWith("1970"));
            const target = validPoints.length > 0 ? validPoints[validPoints.length - 1] : result.points[0];
            setSelectedDate(new Date(target.datetime));
          }
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [deviceId]);

  const processed = useMemo(() => {
    const allPoints = reportData.points || [];
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);

    const filtered = allPoints.filter(p => {
      const pDate = new Date(p.datetime);
      if (pDate.getFullYear() < 2000) return false;
      const current = new Date(pDate);
      current.setHours(0, 0, 0, 0);

      if (viewRange === "day") return current.getTime() === targetDate.getTime();
      if (viewRange === "week") {
        const start = new Date(targetDate);
        start.setDate(targetDate.getDate() - 7);
        return pDate >= start && pDate <= new Date(targetDate).setHours(23, 59, 59);
      }
      if (viewRange === "month") {
        return pDate.getMonth() === targetDate.getMonth() && pDate.getFullYear() === targetDate.getFullYear();
      }
      return true;
    });

    if (filtered.length === 0) return { chart: [], hasData: false, kpi: { sessions: 0, energy: "0 kWh", revenue: "₹0", netIncome: "₹0", co2Saved: "0 kg" } };

    const GAP_LIMIT = 30 * 60 * 1000;
    const CURRENT_THRESHOLD = 1;

    // I × V × Δt / 3600 energy per interval
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
    let totalEnergyKwh = 0;
    let sessionsCount = 0;
    let currentSessionPoints = [];
    let cumulativeWh = 0;

    const chartData = filtered.map((item, index) => {
      if (index === 0) {
        currentSessionPoints.push(item);
      } else {
        const prevTime = new Date(filtered[index - 1].datetime).getTime();
        const currTime = new Date(item.datetime).getTime();
        const prevCurrent = parseFloat(filtered[index - 1].current) || 0;
        const currCurrent = parseFloat(item.current) || 0;
        const sessionBreak = (currTime - prevTime > GAP_LIMIT) ||
          (prevCurrent >= CURRENT_THRESHOLD && currCurrent < CURRENT_THRESHOLD);

        if (sessionBreak) {
          const sessWh = calcEnergyWh(currentSessionPoints);
          totalEnergyKwh += sessWh / 1000;
          sessionsCount++;
          currentSessionPoints = [item];
        } else {
          currentSessionPoints.push(item);
        }
      }

      // Cumulative energy for chart accrual
      if (index > 0) {
        const dtSec = (new Date(item.datetime) - new Date(filtered[index - 1].datetime)) / 1000;
        const curr = parseFloat(item.current) || 0;
        const volt = parseFloat(item.voltage_inlet || item.voltage) || 360;
        if (dtSec <= GAP_LIMIT / 1000) cumulativeWh += curr * volt * dtSec / 3600;
      }
      const cumulativeKwh = cumulativeWh / 1000;

      return {
        time: viewRange === "day"
          ? item.datetime?.split('T')[1]?.substring(0, 5)
          : `${new Date(item.datetime).getDate()}/${new Date(item.datetime).getMonth() + 1} ${item.datetime?.split('T')[1]?.substring(0, 5)}`,
        revenue: parseFloat((cumulativeKwh * TARIFF_RATE).toFixed(2)),
        netIncome: parseFloat((cumulativeKwh * (TARIFF_RATE - COST_RATE)).toFixed(2)),
      };
    });

    // Finalize last session
    totalEnergyKwh += calcEnergyWh(currentSessionPoints) / 1000;
    sessionsCount++;

    return {
      chart: chartData,
      hasData: true,
      kpi: {
        sessions: sessionsCount,
        energy: `${totalEnergyKwh.toFixed(2)} kWh`,
        revenue: `₹${(totalEnergyKwh * TARIFF_RATE).toFixed(0)}`,
        netIncome: `₹${(totalEnergyKwh * (TARIFF_RATE - COST_RATE)).toFixed(0)}`,
        co2Saved: `${(totalEnergyKwh * 0.85).toFixed(1)} kg`
      }
    };
  }, [reportData, selectedDate, viewRange]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <p className="text-gray-400 font-medium animate-pulse">Loading financial report for Device {rawId}...</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopNavigationBar onDateChange={setSelectedDate} onRangeChange={setViewRange} exportId="report-area" showChat={false} />

      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div id="report-area" className="space-y-8">

            {/* Heading + revenue summary */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Financial Report</h1>
                <p className="text-gray-600 text-sm sm:text-base">Device ZIP-UNIT-0{rawId} performance overview</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 min-w-[220px]">
                <p className="text-xs font-medium text-gray-500 mb-1">Total Period Revenue</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  {processed.kpi.revenue}
                </p>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
              <StatCard title="Total Sessions" value={processed.kpi.sessions}  icon={<Activity size={20}/>} gradient="from-blue-500 to-blue-600"    iconBg="bg-blue-500/10"   iconColor="text-blue-600" />
              <StatCard title="Energy Sold"    value={processed.kpi.energy}    icon={<Zap size={20}/>}     gradient="from-amber-500 to-orange-600"  iconBg="bg-amber-500/10"  iconColor="text-amber-600" />
              <StatCard title="Gross Revenue"  value={processed.kpi.revenue}   icon={<Wallet size={20}/>}  gradient="from-indigo-500 to-indigo-600" iconBg="bg-indigo-500/10" iconColor="text-indigo-600" />
              <StatCard title="Net Profit"     value={processed.kpi.netIncome} icon={<TrendingUp size={20}/>} gradient="from-green-500 to-green-600" iconBg="bg-green-500/10" iconColor="text-green-600" />
              <StatCard title="CO₂ Offset"    value={processed.kpi.co2Saved}  icon={<Leaf size={20}/>}    gradient="from-teal-500 to-teal-600"    iconBg="bg-teal-500/10"   iconColor="text-teal-600" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartBox title="Revenue Accrual (INR)" hasData={processed.hasData} icon={<BarChart3 size={18}/>} iconBg="bg-blue-500/10" iconColor="text-blue-600">
                <AreaChart data={processed.chart} margin={{ bottom: 60 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{fontSize: 10, fill: '#64748b', angle: -90, textAnchor: 'end'}} height={70} interval={viewRange === "day" ? 5 : "preserveStartEnd"} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#colorRev)" strokeWidth={3} />
                </AreaChart>
              </ChartBox>

              <ChartBox title="Profit Accumulation (INR)" hasData={processed.hasData} icon={<TrendingUp size={18}/>} iconBg="bg-green-500/10" iconColor="text-green-600">
                <LineChart data={processed.chart} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{fontSize: 10, fill: '#64748b', angle: -90, textAnchor: 'end'}} height={70} interval={viewRange === "day" ? 5 : "preserveStartEnd"} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="netIncome" stroke="#10b981" strokeWidth={3} dot={false} />
                </LineChart>
              </ChartBox>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ChatbotPopup deviceId={rawId} />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400 font-medium animate-pulse">Loading Reports...</p>
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}

function StatCard({ title, value, icon, gradient, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-gray-100 flex flex-col justify-between">
      <div className={`${iconBg} ${iconColor} p-2 sm:p-3 rounded-xl w-fit mb-3`}>{icon}</div>
      <div>
        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{value}</p>
      </div>
    </div>
  );
}

function ChartBox({ title, children, hasData, icon, iconBg, iconColor }) {
  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col h-[420px] hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className={`${iconBg} ${iconColor} p-2.5 rounded-xl`}>{icon}</div>
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
      </div>
      <div className="flex-1 w-full flex items-center justify-center">
        {!hasData ? <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No Active Records Found</p> : <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>}
      </div>
    </Card>
  );
}