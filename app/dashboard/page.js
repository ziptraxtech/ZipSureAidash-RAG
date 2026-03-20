// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import dynamic from "next/dynamic";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
// import { FaMapMarkerAlt, FaBolt, FaExternalLinkAlt } from "react-icons/fa";

// // Disable SSR for Map and Nav to prevent hydration mismatches
// const TopNavigationBar = dynamic(() => import('@/components/TopNavigationBar'), { ssr: false });
// const ChargerMap = dynamic(() => import('@/components/MapComponent'), { ssr: false });

// export default function DashboardPage({isPrintMode = false }) {
//   const [rawData, setRawData] = useState({ points: [], metadata: {} });
//   const [loading, setLoading] = useState(true);
//   const [hasMounted, setHasMounted] = useState(false);

//   useEffect(() => {
//     setHasMounted(true);
//     const fetchData = async () => {
//       try {
//         const response = await fetch("/api/sapna_charger");
//         const result = await response.json();
//         setRawData(result);
//       } catch (error) { 
//         console.error("Fetch error:", error); 
//       } finally { 
//         setLoading(false); 
//       }
//     };
//     fetchData();
//     const interval = setInterval(fetchData, 10000);
//     return () => clearInterval(interval);
//   }, []);

//   const metrics = useMemo(() => {
//     const points = rawData.points || [];
//     const metadata = rawData.metadata || {};
    
//     if (!hasMounted || !points.length) return null;

//     const last = points[points.length - 1];
//     const first = points[0];

//     // 1. FIXED: SESSION TIME LOGIC
//     // We calculate duration strictly based on the data points in the JSON
//     const startTime = new Date(first.datetime);
//     const endTime = new Date(last.datetime);
//     const diff = Math.max(0, endTime - startTime);
    
//     const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
//     const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
//     const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');

//     // 2. FIXED: LAST SEEN LOGIC
//     // Using your split logic to extract the time string safely from the ISO format
//     const lastSeenTime = last.datetime?.split('T')[1]?.substring(0, 5) || "--:--";

//     // 3. SOH & ENERGY LOGIC
//     const startMeter = metadata.meterstart || 0;
//     const deltaSoc = (last.soc || 0) - (first.soc || 0);
//     const deltaE = Math.max(0, (last.energy - startMeter) / 1000); // Wh to kWh
    
//     let soh = 100;
//     if (deltaSoc > 1) {
//       // Simplified SOH placeholder logic
//       const rawSoh = ((deltaE * 0.9) / (deltaSoc / 100) / 60) * 100;
//       soh = Math.min(100, Math.max(0, (100 - rawSoh))).toFixed(1);
//     }

//     // 4. STATUS LOGIC
//     // If the last data point is older than 10 minutes relative to "now", mark offline
//     const now = new Date();
//     const isStale = (now - endTime) / 1000 > 600; 
    
//     let counts = { online: 0, offline: 0, charging: 0, maintenance: 0 };
//     if (isStale) { 
//       counts.offline = 1; 
//     } else {
//       counts.online = 1;
//       if ((last.current || 0) > 0.1) counts.charging = 1;
//     }

//     return {
//       lastCurrent: (last.current || 0).toFixed(2),
//       soh: soh,
//       lastVoltage: last.voltage_inlet || 230,
//       endEnergy: deltaE.toFixed(2),
//       sessionTime: `${h}:${m}:${s}`,
//       lastSeen: lastSeenTime,
//       counts
//     };
//   }, [rawData, hasMounted]);

//   if (!hasMounted) return <div className="p-10 text-center bg-slate-50 min-h-screen">Initializing...</div>;
//   // if (loading) return <div className="p-10 text-center animate-pulse bg-slate-50 min-h-screen font-bold text-slate-400 uppercase tracking-widest">Syncing Telemetry...</div>;
//   if (loading && !rawData.points.length) {
//       return <div className="p-10 text-center animate-pulse bg-slate-50 min-h-screen font-bold text-slate-400">SYNCING TELEMETRY...</div>;
//     }
//   return (
//     <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
//       <TopNavigationBar />
//       <div id="analytics-report-area" className="space-y-8 mt-4">
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-black text-slate-800 tracking-tight">EV Charger B2B Dashboard</h1>
//         <Badge className="bg-white text-slate-400 border-slate-200 uppercase text-[10px] font-bold">Live Feed</Badge>
//       </div>

//       {/* 5 KPI Top Row */}
//       <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//         <KPIBox title="State of Health">
//           <div className="h-16 w-16 relative">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie data={[{v: parseFloat(metrics?.soh ?? 0)}, {v: 100 - parseFloat(metrics?.soh ?? 0)}]} dataKey="v" innerRadius={18} outerRadius={28} stroke="none">
//                   <Cell fill="#10b981" /><Cell fill="#f1f5f9" />
//                 </Pie>
//               </PieChart>
//             </ResponsiveContainer>
//             <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-600">{metrics?.soh ?? 0}%</span>
//           </div>
//           <span className="text-2xl font-black ml-4">{metrics?.soh ?? 0}%</span>
//         </KPIBox>

//         <KPIBox title="Last Current">
//           <span className="text-3xl font-black text-blue-600 tracking-tighter">{metrics?.lastCurrent ?? "0.00"} <span className="text-xs text-slate-400">A</span></span>
//         </KPIBox>

//         <KPIBox title="Last Voltage">
//           <span className="text-3xl font-black text-purple-600 tracking-tighter">{metrics?.lastVoltage ?? "0"} <span className="text-xs text-slate-400">V</span></span>
//         </KPIBox>

//         <KPIBox title="Energy (End)">
//           <span className="text-3xl font-black text-emerald-600 tracking-tighter">{metrics?.endEnergy ?? "0.00"} <span className="text-xs text-slate-400">kWh</span></span>
//         </KPIBox>

//         <KPIBox title="Session Time">
//           <span className="text-3xl font-black text-orange-500 font-mono tracking-tighter">{metrics?.sessionTime ?? "00:00:00"}</span>
//         </KPIBox>
//       </div>

//       {/* Bottom Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* Occupancy */}
//           <div className="space-y-4">
//           <h3 className="text-sm font-bold text-slate-800">Charger Occupancy</h3>
//           <div className="grid grid-cols-2 gap-4">
//             <StatusTile 
//               label="Online" 
//               count={metrics?.counts?.online ?? 0} 
//               isActive={metrics?.counts?.online > 0}
//               colorScheme="green"
//             />
//             <StatusTile 
//               label="Offline" 
//               count={metrics?.counts?.offline ?? 0} 
//               isActive={metrics?.counts?.offline > 0}
//               colorScheme="red"
//             />
//             <StatusTile 
//               label="Charging" 
//               count={metrics?.counts?.charging ?? 0} 
//               isActive={metrics?.counts?.charging > 0}
//               colorScheme="blue"
//             />
//             <StatusTile 
//               label="Under Maintenance" 
//               count={metrics?.counts?.maintenance ?? 0} 
//               isActive={metrics?.counts?.maintenance > 0}
//               colorScheme="yellow"
//             />
//           </div>
//         </div>

//         {/* DEVICE MAP CARD */}
//         <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/60 overflow-hidden bg-white">
//           <div className="p-5 border-b border-slate-50 flex justify-between items-center">
//             <div className="flex items-center gap-3">
//               <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100"><FaMapMarkerAlt size={14} /></div>
//               <span className="font-black text-slate-800 text-sm tracking-tight uppercase">Live Device Location</span>
//             </div>
//             <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-200 text-slate-400 px-3 py-1">Okhla IE, New Delhi</Badge>
//           </div>

//           <div className="h-[380px] relative">
//             <ChargerMap />
            
//             {/* Map Overlay */}
//             <div className="absolute bottom-6 left-6 z-[1000] w-64 bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/50 p-5">
//               <div className="flex items-center justify-between mb-3">
//                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Terminal</span>
//                 <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black ${metrics?.counts?.online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
//                   <div className={`w-1.5 h-1.5 rounded-full ${metrics?.counts?.online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
//                   {metrics?.counts?.online ? 'ONLINE' : 'OFFLINE'}
//                 </div>
//               </div>
              
//               <div className="space-y-0.5 mb-4">
//                 <p className="text-base font-black text-slate-900 leading-none">Sapna Terminal - 01</p>
//                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Device ID: ZIP-SAPNA-01</p>
//               </div>

//               <div className="space-y-2">
//                 <div className="flex justify-between items-end">
//                   <p className="text-[10px] text-slate-500 font-bold uppercase">Health Score</p>
//                   <p className="text-sm font-black text-emerald-500">{metrics?.soh ?? 0}%</p>
//                 </div>
//                 <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
//                   <div className="h-full bg-emerald-500" style={{ width: `${metrics?.soh ?? 0}%` }} />
//                 </div>
//               </div>

//               <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-slate-400 font-bold text-[9px]">
//                 <span>Last Sync: {metrics?.lastSeen ?? "--:--"}</span>
//                 <button onClick={() => window.open(`https://www.google.com/maps?q=28.5594,77.2444`, '_blank')} className="text-blue-600 flex items-center gap-1 uppercase hover:underline">Navigate <FaExternalLinkAlt size={8} /></button>
//               </div>
//             </div>
//           </div>
//         </Card>
//       </div>
//       </div>
//     </div>
//   );
// }

// function KPIBox({ title, children }) {
//   return (
//     <Card className="rounded-2xl border-none shadow-sm p-5 flex flex-col justify-between min-h-[140px] bg-white">
//       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
//       <div className="mt-auto flex items-center">{children}</div>
//     </Card>
//   );
// }

// function StatusTile({ label, count, colorScheme }) {
//   const schemes = {
//     green: { bg: "bg-[#eefcf3]", text: "text-[#10b981]", border: "border-[#dcfce7]" },
//     red: { bg: "bg-[#fff1f2]", text: "text-[#f43f5e]", border: "border-[#ffe4e6]" },
//     blue: { bg: "bg-[#eff6ff]", text: "text-[#3b82f6]", border: "border-[#dbeafe]" },
//     yellow: { bg: "bg-[#fefce8]", text: "text-[#eab308]", border: "border-[#fef9c3]" },
//   };

//   const current = schemes[colorScheme];

//   return (
//     <div className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center ${current.bg} ${current.border}`}>
//       <span className={`text-[11px] font-bold mb-1 ${current.text}`}>
//         {label}
//       </span>
//       <span className={`text-4xl font-black tracking-tighter ${current.text}`}>
//         {count}
//       </span>
//     </div>
//   );
// }
"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FaMapMarkerAlt, FaExternalLinkAlt } from "react-icons/fa";

const TopNavigationBar = dynamic(() => import('@/components/TopNavigationBar'), { 
  ssr: false,
  loading: () => <div className="h-16 w-full animate-pulse bg-slate-100 rounded-full mb-6" /> 
});
const ChargerMap = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function DashboardPage() {
  const [rawData, setRawData] = useState({ points: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  // UNIVERSAL STATES
  const [selectedDate, setSelectedDate] = useState(new Date("2026-03-13"));
  const [viewRange, setViewRange] = useState("day");

  useEffect(() => {
    setHasMounted(true);
    const fetchData = async () => {
      try {
        const response = await fetch("/api/sapna_charger");
        const result = await response.json();
        setRawData(result);
      } catch (error) { 
        console.error("Fetch error:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const allPoints = rawData.points || [];
    const metadata = rawData.metadata || {};
    
    if (!hasMounted) return null;

    // 1. UNIVERSAL FILTERING
    const filtered = allPoints.filter(p => {
      const pDate = new Date(p.datetime);
      
      // Normalize dates to midnight for accurate comparison
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      
      const current = new Date(pDate);
      current.setHours(0, 0, 0, 0);

      // 1. DAILY: Must match exactly
      if (viewRange === "day") {
        return current.getTime() === selected.getTime();
      }

      // 2. WEEKLY: Show data from (Selected Date - 7 days) up to (Selected Date)
      if (viewRange === "week") {
        const sevenDaysAgo = new Date(selected);
        sevenDaysAgo.setDate(selected.getDate() - 7);
        return current >= sevenDaysAgo && current <= selected;
      }

      // 3. MONTHLY: Show all data within the same Month and Year
      if (viewRange === "month") {
        return (
          current.getMonth() === selected.getMonth() &&
          current.getFullYear() === selected.getFullYear()
        );
      }

      return true;
    });

    // 2. EMPTY STATE CHECK (Return null if no data for selected date)
    if (filtered.length === 0) return null;

    const last = filtered[filtered.length - 1];
    const first = filtered[0];

    // Session Time
    const diff = Math.max(0, new Date(last.datetime) - new Date(first.datetime));
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');

    // Energy & SOH
    const startMeter = metadata.meterstart || 0;
    const deltaSoc = (last.soc || 0) - (first.soc || 0);
    const deltaE = Math.max(0, (last.energy - startMeter) / 1000);
    
    let sohValue = 100;
    if (deltaSoc > 1) {
      const rawSoh = ((deltaE * 0.9) / (deltaSoc / 100) / 60) * 100;
      sohValue = Math.min(100, Math.max(0, (100 - rawSoh))).toFixed(1);
    }

    return {
      lastCurrent: (last.current || 0).toFixed(2),
      soh: sohValue,
      lastVoltage: last.voltage_inlet || 230,
      endEnergy: deltaE.toFixed(2),
      sessionTime: `${h}:${m}:${s}`,
      lastSeen: last.datetime?.split('T')[1]?.substring(0, 5) || "--:--",
      isOnline: (new Date() - new Date(last.datetime)) / 1000 < 600,
      counts: {
        online: (new Date() - new Date(last.datetime)) / 1000 < 600 ? 1 : 0,
        offline: (new Date() - new Date(last.datetime)) / 1000 >= 600 ? 1 : 0,
        charging: (last.current || 0) > 0.1 ? 1 : 0,
        maintenance: 0
      }
    };
  }, [rawData, hasMounted, selectedDate, viewRange]);

  if (!hasMounted) return null;

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      <TopNavigationBar 
        onDateChange={setSelectedDate} 
        onRangeChange={setViewRange} 
        exportId="analytics-report-area" 
      />

      <div id="analytics-report-area" className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Executive Overview</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">
              {metrics ? `Last Updated: ${metrics.lastSeen}` : "No Telemetry found for this date"}
            </p>
          </div>
          <Badge className="bg-white text-slate-400 border-slate-200 uppercase text-[9px] font-black px-4 py-1.5 shadow-sm">
            {metrics?.isOnline ? "● Live Data" : "○ Historical Data"}
          </Badge>
        </div>

        {/* 5 KPI Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <KPIBox title="State of Health">
            <div className="h-14 w-14 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={[
                      {v: metrics ? parseFloat(metrics.soh) : 0}, 
                      {v: metrics ? 100 - parseFloat(metrics.soh) : 100}
                    ]} 
                    dataKey="v" innerRadius={16} outerRadius={24} stroke="none" startAngle={90} endAngle={450}
                  >
                    <Cell fill={metrics ? "#10b981" : "#e2e8f0"} />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-400">
                {metrics ? `${metrics.soh}%` : "--"}
              </span>
            </div>
            <span className="text-2xl font-black ml-4 tracking-tighter">{metrics ? `${metrics.soh}%` : "--"}</span>
          </KPIBox>

          <StatBox title="Last Current" value={metrics?.lastCurrent} unit="A" color="text-blue-600" />
          <StatBox title="Last Voltage" value={metrics?.lastVoltage} unit="V" color="text-purple-600" />
          <StatBox title="Energy (End)" value={metrics?.endEnergy} unit="kWh" color="text-emerald-600" />
          <StatBox title="Session Time" value={metrics?.sessionTime} unit="" color="text-orange-500 font-mono" />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Occupancy */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Charger Occupancy</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatusTile label="Online" count={metrics?.counts?.online ?? 0} colorScheme="green" />
              <StatusTile label="Offline" count={metrics?.counts?.offline ?? 0} colorScheme="red" />
              <StatusTile label="Charging" count={metrics?.counts?.charging ?? 0} colorScheme="blue" />
              <StatusTile label="Maintenance" count={metrics?.counts?.maintenance ?? 0} colorScheme="yellow" />
            </div>
          </div>

          {/* DEVICE MAP CARD */}
          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 p-2.5 rounded-2xl text-white"><FaMapMarkerAlt size={14} /></div>
                <span className="font-black text-slate-800 text-xs tracking-widest uppercase">Live Terminal</span>
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-100 text-slate-400 px-4">Okhla IE, New Delhi</Badge>
            </div>

            <div className="h-[380px] relative">
              <ChargerMap />
              
              <div className="absolute bottom-6 left-6 z-[1000] w-64 bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl border border-white/40 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">ZIP-SAPNA-01</span>
                  <div className={`px-2 py-0.5 rounded-full text-[8px] font-black ${metrics?.isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {metrics?.isOnline ? 'ONLINE' : 'OFFLINE'}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-black text-slate-900 leading-none">Sapna Terminal</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Last Sync: {metrics?.lastSeen ?? "--:--"}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <p className="text-[9px] text-slate-500 font-black uppercase">Health Status</p>
                      <p className="text-xs font-black text-emerald-500">{metrics ? `${metrics.soh}%` : "--"}</p>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${metrics?.soh ?? 0}%` }} />
                    </div>
                  </div>
                </div>

                <button className="w-full mt-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
                  Navigate To Terminal <FaExternalLinkAlt size={10} />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KPIBox({ title, children }) {
  return (
    <Card className="rounded-[2rem] border-none shadow-sm p-6 flex flex-col justify-between min-h-[140px] bg-white transition-hover hover:shadow-xl hover:shadow-slate-200/40">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
      <div className="mt-auto flex items-center">{children}</div>
    </Card>
  );
}

function StatBox({ title, value, unit, color }) {
  return (
    <KPIBox title={title}>
      <span className={`text-3xl font-black tracking-tighter ${color}`}>
        {value ?? "--"} <span className="text-[10px] text-slate-300 ml-1">{unit}</span>
      </span>
    </KPIBox>
  );
}

function StatusTile({ label, count, colorScheme }) {
  const schemes = {
    green: { bg: "bg-emerald-50/50", text: "text-emerald-600", border: "border-emerald-100" },
    red: { bg: "bg-rose-50/50", text: "text-rose-600", border: "border-rose-100" },
    blue: { bg: "bg-blue-50/50", text: "text-blue-600", border: "border-blue-100" },
    yellow: { bg: "bg-amber-50/50", text: "text-amber-600", border: "border-amber-100" },
  };
  const s = schemes[colorScheme];
  return (
    <div className={`p-8 rounded-[2rem] border transition-all flex flex-col items-center justify-center ${s.bg} ${s.border}`}>
      <span className={`text-[9px] font-black uppercase tracking-widest mb-2 ${s.text}`}>{label}</span>
      <span className={`text-4xl font-black tracking-tighter ${s.text}`}>{count ?? 0}</span>
    </div>
  );
}