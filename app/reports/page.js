// "use client";

// import { useState, useEffect, useMemo } from "react";
// import dynamic from "next/dynamic";
// import {
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   AreaChart,
//   Area
// } from "recharts";
// import { Card } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Wallet, TrendingUp, Leaf, Zap, BarChart3, Activity } from 'lucide-react';

// const TopNavigationBar = dynamic(() => import('@/components/TopNavigationBar'), { 
//   ssr: false,
//   loading: () => <div className="h-16 w-full animate-pulse bg-slate-100 rounded-full mb-6" /> 
// });

// export default function ReportsPage() {
//   const [mounted, setMounted] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [reportData, setReportData] = useState({ metadata: {}, points: [] });
  
//   const [selectedDate, setSelectedDate] = useState(new Date("2026-03-13"));
//   const [viewRange, setViewRange] = useState("day");

//   const TARIFF_RATE = 15; 
//   const COST_RATE = 5;    

//   useEffect(() => {
//     setMounted(true);
//     const fetchData = async () => {
//       try {
//         const response = await fetch("/api/sapna_charger");
//         const result = await response.json();
//         setReportData(result);
//       } catch (error) {
//         console.error("Fetch Error:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const processed = useMemo(() => {
//     const allPoints = reportData.points || [];
//     const metadata = reportData.metadata || {};

//     const filteredPoints = allPoints.filter(p => {
//       const pDate = new Date(p.datetime);
//       const selected = new Date(selectedDate);
//       selected.setHours(0, 0, 0, 0);
//       const current = new Date(pDate);
//       current.setHours(0, 0, 0, 0);

//       if (viewRange === "day") return current.getTime() === selected.getTime();
//       if (viewRange === "week") {
//         const sevenDaysAgo = new Date(selected);
//         sevenDaysAgo.setDate(selected.getDate() - 7);
//         return current >= sevenDaysAgo && current <= selected;
//       }
//       if (viewRange === "month") {
//         return current.getMonth() === selected.getMonth() && current.getFullYear() === selected.getFullYear();
//       }
//       return true;
//     });
    
//     if (filteredPoints.length === 0) {
//       return { 
//         chart: [], 
//         hasData: false,
//         kpi: { sessions: "--", energy: "--", revenue: "--", netIncome: "--", co2Saved: "--" } 
//       };
//     }

//     const startMeter = metadata.meterstart || 0;
//     const chartData = filteredPoints.map((item) => {
//       const displayTime = item.datetime?.split('T')[1]?.substring(0, 5) || "00:00";
//       const currentWh = item.energy || startMeter;
//       const kwhAtPoint = Math.max(0, (currentWh - startMeter) / 1000);
      
//       return {
//         time: displayTime,
//         revenue: parseFloat((kwhAtPoint * TARIFF_RATE).toFixed(2)),
//         netIncome: parseFloat((kwhAtPoint * (TARIFF_RATE - COST_RATE)).toFixed(2)),
//         energy: parseFloat(kwhAtPoint.toFixed(3))
//       };
//     });

//     const final = chartData[chartData.length - 1];

//     return {
//       chart: chartData,
//       hasData: true,
//       kpi: {
//         sessions: metadata.idtag ? 1 : 0, 
//         energy: `${final.energy} kWh`, 
//         revenue: `₹${final.revenue}`,
//         netIncome: `₹${final.netIncome}`,
//         co2Saved: `${(final.energy * 0.85).toFixed(2)} kg`
//       }
//     };
//   }, [reportData, selectedDate, viewRange]);

//   if (!mounted) return null;

//   return (
//     <div className="bg-[#F8FAFC] min-h-screen font-sans w-full pb-12">
//       <TopNavigationBar 
//         onDateChange={setSelectedDate} 
//         onRangeChange={setViewRange}
//         exportId="analytics-report-area"
//       />

//       {/* Center Aligned Container */}
//       <div id="analytics-report-area" className="p-8 max-w-[1600px] mx-auto space-y-8">
        
//         {/* Header Branding Section */}
//         <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
//           <div className="space-y-2 text-center md:text-left">
//             <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase ">Financial report</h1>
//             <p className="text-slate-500 text-sm font-medium">Monitor the revenue and profit generation </p>
//             <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
//               <Badge variant="outline" className="bg-slate-50 px-4 py-1.5 border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
//                 TRANSACTION: {processed.hasData ? reportData.metadata?.idtag : "N/A"}
//               </Badge>
//               <Badge className={`px-4 py-1.5 font-bold text-[10px] uppercase tracking-widest ${processed.hasData ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
//                 {processed.hasData ? '● Verified Data' : '○ No Records'}
//               </Badge>
//             </div>
//           </div>
//           <div className="bg-[#0F172A] p-8 px-12 rounded-[2rem] text-white shadow-xl min-w-[300px] text-center md:text-right">
//              <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Session Revenue</p>
//              <p className="text-5xl font-black tracking-tighter">{processed.kpi.revenue}</p>
//           </div>
//         </div>

//         {/* KPI Grid - Matching the Stat Box look from Screenshot 2 */}
//         <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
//           <StatCard title="Active Sessions" value={processed.kpi.sessions} icon={<Activity size={18}/>} iconBg="bg-blue-500" />
//           <StatCard title="Power Used" value={processed.kpi.energy} icon={<Zap size={18}/>} iconBg="bg-amber-500" />
//           <StatCard title="Gross Rev" value={processed.kpi.revenue} icon={<Wallet size={18}/>} iconBg="bg-indigo-500" />
//           <StatCard title="Net Profit" value={processed.kpi.netIncome} icon={<TrendingUp size={18}/>} iconBg="bg-emerald-500" />
//           <StatCard title="CO2 Saved" value={processed.kpi.co2Saved} icon={<Leaf size={18}/>} iconBg="bg-teal-500" />
//         </div>

//         {/* Charts Section */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
//           <ChartBox title="Revenue Accrual" hasData={processed.hasData} icon={<BarChart3 size={20}/>} iconBg="bg-blue-600">
//             <AreaChart data={processed.chart}>
//               <defs>
//                 <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
//                   <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
//                 </linearGradient>
//               </defs>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//               <XAxis dataKey="time" tick={{fontSize: 11, fontWeight: 700, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
//               <YAxis tick={{fontSize: 11, fontWeight: 700, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
//               <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
//               <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" strokeWidth={4} />
//             </AreaChart>
//           </ChartBox>

//           <ChartBox title="Profit Accumulation" hasData={processed.hasData} icon={<TrendingUp size={20}/>} iconBg="bg-emerald-600">
//             <LineChart data={processed.chart}>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//               <XAxis dataKey="time" tick={{fontSize: 11, fontWeight: 700, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
//               <YAxis tick={{fontSize: 11, fontWeight: 700, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
//               <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}/>
//               <Line type="monotone" dataKey="netIncome" stroke="#10b981" strokeWidth={4} dot={false} />
//             </LineChart>
//           </ChartBox>
//         </div>
//       </div>
//     </div>
//   );
// }

// function StatCard({ title, value, icon, iconBg }) {
//   return (
//     <Card className="bg-white p-6 rounded-[2rem] border-none shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-40">
//       <div className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200`}>
//         {icon}
//       </div>
//       <div>
//         <p className="text-[10px] uppercase text-slate-400 font-black tracking-[0.15em] mb-1">{title}</p>
//         <p className="text-2xl font-black tracking-tighter text-slate-900">{value}</p>
//       </div>
//     </Card>
//   );
// }

// function ChartBox({ title, children, hasData, icon, iconBg }) {
//   return (
//     <Card className="bg-white rounded-[2.5rem] p-8 border-none shadow-sm flex flex-col h-[480px]">
//       <div className="flex items-center mb-10">
//         <div className={`${iconBg} p-2.5 rounded-xl text-white mr-4 shadow-md`}>
//           {icon}
//         </div>
//         <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">{title}</h3>
//       </div>
      
//       <div className="flex-1 w-full flex items-center justify-center">
//         {!hasData ? (
//           <div className="text-center space-y-3">
//              <div className="w-16 h-1 bg-slate-100 mx-auto rounded-full animate-pulse" />
//              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No Active Sessions Found</p>
//           </div>
//         ) : (
//           <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
//         )}
//       </div>
//     </Card>
//   );
// }
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, Leaf, Zap, BarChart3, Activity } from 'lucide-react';

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
    if (rawId === "9") return "sapna_charger";
    const num = parseInt(rawId);
    return (num >= 2 && num <= 8) ? `device${num}` : rawId;
  }, [rawId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = deviceId === "sapna_charger" 
          ? "/api/sapna_charger" 
          : `/api/charger_data?device=${deviceId}`;
        const response = await fetch(apiUrl);
        const result = await response.json();
        if (response.ok) setReportData(result);
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

    // Session-based Financial Logic
    let totalEnergyKwh = 0;
    const GAP_LIMIT = 30 * 60 * 1000;
    let sessionsCount = 0;
    let currentSessionPoints = [];

    const chartData = filtered.map((item, index) => {
      const pTime = new Date(item.datetime).getTime();
      
      // Detect Session Start/End for KPI counting
      if (index > 0) {
        const prevTime = new Date(filtered[index-1].datetime).getTime();
        if (pTime - prevTime > GAP_LIMIT) {
          const startE = currentSessionPoints[0]?.energy || 0;
          const endE = currentSessionPoints[currentSessionPoints.length - 1]?.energy || 0;
          totalEnergyKwh += Math.max(0, (endE - startE) / 1000);
          sessionsCount++;
          currentSessionPoints = [item];
        } else {
          currentSessionPoints.push(item);
        }
      } else {
        currentSessionPoints.push(item);
      }

      // Live Accrual for Chart
      const startMeter = filtered[0].energy || 0;
      const sessionDeltaKwh = Math.max(0, ((item.energy || 0) - startMeter) / 1000);

      return {
        time: viewRange === "day" 
          ? item.datetime?.split('T')[1]?.substring(0, 5) 
          : `${new Date(item.datetime).getDate()}/${new Date(item.datetime).getMonth() + 1} ${item.datetime?.split('T')[1]?.substring(0, 5)}`,
        revenue: parseFloat((sessionDeltaKwh * TARIFF_RATE).toFixed(2)),
        netIncome: parseFloat((sessionDeltaKwh * (TARIFF_RATE - COST_RATE)).toFixed(2)),
      };
    });

    // Finalize last session
    const lastStart = currentSessionPoints[0]?.energy || 0;
    const lastEnd = currentSessionPoints[currentSessionPoints.length - 1]?.energy || 0;
    totalEnergyKwh += Math.max(0, (lastEnd - lastStart) / 1000);
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

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-300 uppercase italic">Generating Financial Report {rawId}...</div>;

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans w-full pb-12">
      <TopNavigationBar onDateChange={setSelectedDate} onRangeChange={setViewRange} exportId="report-area" />

      <div id="report-area" className="p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase ">Financial report</h1>
            <p className="text-slate-500 text-sm font-medium">Device: ZIP-UNIT-0{rawId} Performance</p>
          </div>
          <div className="bg-[#0F172A] p-8 px-12 rounded-[2rem] text-white shadow-xl min-w-[300px] text-center md:text-right">
             <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Total Period Revenue</p>
             <p className="text-5xl font-black tracking-tighter">{processed.kpi.revenue}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard title="Total Sessions" value={processed.kpi.sessions} icon={<Activity size={18}/>} iconBg="bg-blue-500" />
          <StatCard title="Energy Sold" value={processed.kpi.energy} icon={<Zap size={18}/>} iconBg="bg-amber-500" />
          <StatCard title="Gross Rev" value={processed.kpi.revenue} icon={<Wallet size={18}/>} iconBg="bg-indigo-500" />
          <StatCard title="Net Profit" value={processed.kpi.netIncome} icon={<TrendingUp size={18}/>} iconBg="bg-emerald-500" />
          <StatCard title="CO2 Offset" value={processed.kpi.co2Saved} icon={<Leaf size={18}/>} iconBg="bg-teal-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
          <ChartBox title="Revenue Accrual (INR)" hasData={processed.hasData} icon={<BarChart3 size={20}/>} iconBg="bg-blue-600">
            <AreaChart data={processed.chart} margin={{ bottom: 60 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{fontSize: 10, fontWeight: 700, fill: '#64748b', angle: -90, textAnchor: 'end'}} height={70} interval={viewRange === "day" ? 5 : "preserveStartEnd"} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 11, fontWeight: 700, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#colorRev)" strokeWidth={4} />
            </AreaChart>
          </ChartBox>

          <ChartBox title="Profit Accumulation (INR)" hasData={processed.hasData} icon={<TrendingUp size={20}/>} iconBg="bg-emerald-600">
            <LineChart data={processed.chart} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{fontSize: 10, fontWeight: 700, fill: '#64748b', angle: -90, textAnchor: 'end'}} height={70} interval={viewRange === "day" ? 5 : "preserveStartEnd"} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 11, fontWeight: 700, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="netIncome" stroke="#10b981" strokeWidth={4} dot={false} />
            </LineChart>
          </ChartBox>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div>Loading Reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}

function StatCard({ title, value, icon, iconBg }) {
  return (
    <Card className="bg-white p-6 rounded-[2rem] border-none shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-40">
      <div className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200`}>{icon}</div>
      <div>
        <p className="text-[10px] uppercase text-slate-400 font-black tracking-[0.15em] mb-1">{title}</p>
        <p className="text-2xl font-black tracking-tighter text-slate-900">{value}</p>
      </div>
    </Card>
  );
}

function ChartBox({ title, children, hasData, icon, iconBg }) {
  return (
    <Card className="bg-white rounded-[2.5rem] p-8 border-none shadow-sm flex flex-col h-[480px]">
      <div className="flex items-center mb-10">
        <div className={`${iconBg} p-2.5 rounded-xl text-white mr-4 shadow-md`}>{icon}</div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">{title}</h3>
      </div>
      <div className="flex-1 w-full flex items-center justify-center">
        {!hasData ? <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No Active Records Found</p> : <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>}
      </div>
    </Card>
  );
}