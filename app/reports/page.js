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

// const TopNavigationBar = dynamic(() => import('@/components/TopNavigationBar'), { 
//   ssr: false,
//   loading: () => <div className="h-16 w-full animate-pulse bg-slate-100 rounded-full mb-6" /> 
// });

// export default function ReportsPage() {
//   const [mounted, setMounted] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [reportData, setReportData] = useState({ metadata: {}, points: [] });

//   // Pricing Constants
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
//     const interval = setInterval(fetchData, 100000);
//     return () => clearInterval(interval);
//   }, []);

//   const processed = useMemo(() => {
//     const points = reportData.points || [];
//     const metadata = reportData.metadata || {};
    
//     if (points.length === 0) {
//       return { chart: [], kpi: { sessions: 0, energy: 0, revenue: 0, netIncome: 0, co2Saved: 0 } };
//     }

//     const startMeter = metadata.meterstart || 0;
    
//     // 1. Map the points to our chart structure
//     const chartData = points.map((item) => {
//       // Use your splitting logic for the X-Axis Label
//       const displayTime = item.datetime?.split('T')[1]?.substring(0, 8) || "00:00:00";

//       // 2. Calculate kWh consumed at THIS specific point
//       // (Current Meter Reading - Start Meter Reading) / 1000
//       const currentWh = item.energy || startMeter;
//       const kwhAtPoint = Math.max(0, (currentWh - startMeter) / 1000);
      
//       const pointRevenue = kwhAtPoint * TARIFF_RATE;
//       const pointNetIncome = pointRevenue - (kwhAtPoint * COST_RATE);

//       return {
//         time: displayTime,
//         revenue: parseFloat(pointRevenue.toFixed(2)),
//         netIncome: parseFloat(pointNetIncome.toFixed(2)),
//         energy: parseFloat(kwhAtPoint.toFixed(3))
//       };
//     });

//     // 3. Final KPI Summaries (using the very last point)
//     const finalPoint = chartData[chartData.length - 1];
//     const totalKwh = finalPoint.energy;
//     const totalRevenue = finalPoint.revenue;
//     const totalNetIncome = finalPoint.netIncome;

//     return {
//       chart: chartData,
//       kpi: {
//         sessions: metadata.idtag ? 1 : 0, 
//         energy: totalKwh.toFixed(3), 
//         revenue: totalRevenue.toFixed(2),
//         netIncome: totalNetIncome.toFixed(2),
//         co2Saved: (totalKwh * 0.85).toFixed(2)
//       }
//     };
//   }, [reportData]);

//   if (!mounted) return null;

//   if (loading && reportData.points.length === 0) {
//     return <div className="p-20 text-center font-black animate-pulse text-slate-400">SYNCING REVENUE DATA...</div>;
//   }

//   return (
//     <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
//       <TopNavigationBar />
//       <div id="analytics-report-area" className="bg-white p-10 rounded-[2.5rem] mt-4 shadow-sm border border-slate-100">

//       <div className="space-y-10 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 mt-4">
//         <div className="flex justify-between items-start border-b border-slate-100 pb-8">
//           <div>
//             <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Financial Performance</h2>
//             <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">
//               Transaction: {reportData.metadata?.idtag || "N/A"}
//             </p>
//           </div>
//           <div className="text-right">
//              <p className="text-[10px] font-black text-slate-300 uppercase leading-none">Billing Verified</p>
//              <p className="text-xs font-bold text-slate-500 tracking-tight">Rate: ₹{TARIFF_RATE}/kWh</p>
//           </div>
//         </div>

//         {/* KPI Row */}
//         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//           <StatCard title="Active Sessions" value={processed.kpi.sessions} />
//           <StatCard title="Energy Dispensed" value={`${processed.kpi.energy} kWh`} />
//           <StatCard title="Gross Revenue" value={`₹${processed.kpi.revenue}`} color="text-blue-600" />
//           <StatCard title="Net Income" value={`₹${processed.kpi.netIncome}`} color="text-[#10b981]" />
//           <StatCard title="Carbon Offset" value={`${processed.kpi.co2Saved} kg`} />
//         </div>

//         {/* Charts Section */}
//         <div className="grid grid-cols-1 gap-12">
          
//           <ChartBox title="Gross Revenue Accrual (₹)">
//             <AreaChart data={processed.chart}>
//               <defs>
//                 <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
//                   <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
//                 </linearGradient>
//               </defs>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//               <XAxis dataKey="time" tick={{fontSize: 10, fontWeight: 'bold', fill: '#cbd5e1'}} axisLine={false} tickLine={false} />
//               <YAxis tick={{fontSize: 10, fontWeight: 'bold', fill: '#cbd5e1'}} axisLine={false} tickLine={false} />
//               <Tooltip />
//               <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
//             </AreaChart>
//           </ChartBox>

//           <ChartBox title="Net Income Accumulation (₹)">
//             <LineChart data={processed.chart}>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//               <XAxis dataKey="time" tick={{fontSize: 10, fontWeight: 'bold', fill: '#cbd5e1'}} axisLine={false} tickLine={false} />
//               <YAxis tick={{fontSize: 10, fontWeight: 'bold', fill: '#cbd5e1'}} axisLine={false} tickLine={false} />
//               <Tooltip />
//               <Line type="stepAfter" dataKey="netIncome" stroke="#10b981" strokeWidth={4} dot={false} />
//             </LineChart>
//           </ChartBox>

//         </div>
//       </div>
//       </div>
//     </div>
//   );
// }

// function StatCard({ title, value, color = "text-slate-900" }) {
//   return (
//     <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
//       <p className="text-[9px] uppercase text-slate-400 font-black tracking-widest mb-2">{title}</p>
//       <p className={`text-xl font-black ${color}`}>{value}</p>
//     </div>
//   );
// }

// function ChartBox({ title, children }) {
//   return (
//     <div className="space-y-6">
//       <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">{title}</h3>
//       <div className="h-80 w-full bg-slate-50/50 rounded-3xl p-6 border border-slate-50">
//         <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

const TopNavigationBar = dynamic(() => import('@/components/TopNavigationBar'), { 
  ssr: false,
  loading: () => <div className="h-16 w-full animate-pulse bg-slate-100 rounded-full mb-6" /> 
});

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({ metadata: {}, points: [] });
  
  // States for Universal Filtering
  const [selectedDate, setSelectedDate] = useState(new Date("2026-03-13"));
  const [viewRange, setViewRange] = useState("day");

  const TARIFF_RATE = 15; 
  const COST_RATE = 5;    

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const response = await fetch("/api/sapna_charger");
        const result = await response.json();
        setReportData(result);
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processed = useMemo(() => {
    const allPoints = reportData.points || [];
    const metadata = reportData.metadata || {};

    // UNIVERSAL FILTERING LOGIC
    const filteredPoints = allPoints.filter(p => {
      const pDate = new Date(p.datetime);
      
      // Normalize dates to remove time for accurate day-by-day comparison
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      
      const current = new Date(pDate);
      current.setHours(0, 0, 0, 0);

      if (viewRange === "day") {
        return current.getTime() === selected.getTime();
      }

      if (viewRange === "week") {
        const sevenDaysAgo = new Date(selected);
        sevenDaysAgo.setDate(selected.getDate() - 7);
        return current >= sevenDaysAgo && current <= selected;
      }

      if (viewRange === "month") {
        return (
          current.getMonth() === selected.getMonth() &&
          current.getFullYear() === selected.getFullYear()
        );
      }

      return true;
    });
    
    // EMPTY STATE HANDLER
    if (filteredPoints.length === 0) {
      return { 
        chart: [], 
        hasData: false,
        kpi: { sessions: "--", energy: "--", revenue: "--", netIncome: "--", co2Saved: "--" } 
      };
    }

    const startMeter = metadata.meterstart || 0;
    
    const chartData = filteredPoints.map((item) => {
      const displayTime = item.datetime?.split('T')[1]?.substring(0, 8) || "00:00:00";
      const currentWh = item.energy || startMeter;
      const kwhAtPoint = Math.max(0, (currentWh - startMeter) / 1000);
      
      return {
        time: displayTime,
        revenue: parseFloat((kwhAtPoint * TARIFF_RATE).toFixed(2)),
        netIncome: parseFloat((kwhAtPoint * (TARIFF_RATE - COST_RATE)).toFixed(2)),
        energy: parseFloat(kwhAtPoint.toFixed(3))
      };
    });

    const final = chartData[chartData.length - 1];

    return {
      chart: chartData,
      hasData: true,
      kpi: {
        sessions: metadata.idtag ? 1 : 0, 
        energy: `${final.energy} kWh`, 
        revenue: `₹${final.revenue}`,
        netIncome: `₹${final.netIncome}`,
        co2Saved: `${(final.energy * 0.85).toFixed(2)} kg`
      }
    };
  }, [reportData, selectedDate, viewRange]);

  if (!mounted) return null;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      <TopNavigationBar 
        onDateChange={setSelectedDate} 
        onRangeChange={setViewRange}
        exportId="analytics-report-area"
      />

      <div id="analytics-report-area" className="bg-white p-10 rounded-[2.5rem] mt-4 shadow-sm border border-slate-100">
        <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Financial Intelligence</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">
              {processed.hasData ? `Transaction: ${reportData.metadata?.idtag}` : "No Active Transaction for this period"}
            </p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-300 uppercase leading-none">Status</p>
             <p className={`text-xs font-bold tracking-tight ${processed.hasData ? 'text-emerald-500' : 'text-slate-400'}`}>
                {processed.hasData ? '● DATA VERIFIED' : '○ NO RECORDS'}
             </p>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Active Sessions" value={processed.kpi.sessions} />
          <StatCard title="Total Energy" value={processed.kpi.energy} />
          <StatCard title="Gross Revenue" value={processed.kpi.revenue} color="text-blue-600" />
          <StatCard title="Net Profit" value={processed.kpi.netIncome} color="text-emerald-600" />
          <StatCard title="CO2 Offset" value={processed.kpi.co2Saved} color="text-teal-600" />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-12 mt-12">
          <ChartBox title="Revenue Accrual" hasData={processed.hasData}>
            <AreaChart data={processed.chart}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{fontSize: 10, fontWeight: 'bold', fill: '#cbd5e1'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10, fontWeight: 'bold', fill: '#cbd5e1'}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{stroke: '#2563eb', strokeWidth: 1}} contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
            </AreaChart>
          </ChartBox>

          <ChartBox title="Profit Accumulation" hasData={processed.hasData}>
            <LineChart data={processed.chart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{fontSize: 10, fontWeight: 'bold', fill: '#cbd5e1'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10, fontWeight: 'bold', fill: '#cbd5e1'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}/>
              <Line type="stepAfter" dataKey="netIncome" stroke="#10b981" strokeWidth={4} dot={false} />
            </LineChart>
          </ChartBox>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color = "text-slate-900" }) {
  return (
    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
      <p className="text-[9px] uppercase text-slate-400 font-black tracking-[0.2em] mb-3">{title}</p>
      <p className={`text-2xl font-black tracking-tighter ${color}`}>{value}</p>
    </div>
  );
}

function ChartBox({ title, children, hasData }) {
  return (
    <div className="space-y-6 relative">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">{title}</h3>
      <div className="h-80 w-full bg-slate-50/30 rounded-[2.5rem] p-8 border border-slate-100 flex items-center justify-center">
        {!hasData ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-1 bg-slate-200 rounded-full animate-pulse" />
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Telemetry Recorded</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        )}
      </div>
    </div>
  );
}