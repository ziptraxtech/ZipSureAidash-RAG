"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, AreaChart, Area
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TopNavigationBar = dynamic(() => import('@/components/TopNavigationBar'), { 
  ssr: false,
  loading: () => <div className="h-16 w-full animate-pulse bg-slate-100 rounded-full mb-6" /> 
});

export default function Analytics() {
  const [rawData, setRawData] = useState({ points: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  
  // UNIVERSAL FILTER STATES
  const [selectedDate, setSelectedDate] = useState(new Date("2026-03-13"));
  const [viewRange, setViewRange] = useState("day");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/sapna_charger");
        const result = await response.json();
        setRawData(result);
      } catch (error) {
        console.error("Data Load Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processed = useMemo(() => {
    const allPoints = rawData.points || [];
    const meta = rawData.metadata || {};

    // 1. UNIVERSAL FILTERING LOGIC
    const filtered = allPoints.filter(p => {
      const pDate = new Date(p.datetime);
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      const current = new Date(pDate);
      current.setHours(0, 0, 0, 0);

      if (viewRange === "day") return current.getTime() === selected.getTime();
      
      if (viewRange === "week") {
        const sevenDaysAgo = new Date(selected);
        sevenDaysAgo.setDate(selected.getDate() - 7);
        return current >= sevenDaysAgo && current <= selected;
      }

      if (viewRange === "month") {
        return current.getMonth() === selected.getMonth() && current.getFullYear() === selected.getFullYear();
      }
      return true;
    });

    // 2. EMPTY STATE CHECK
    if (filtered.length === 0) {
      return { chartData: [], hasData: false, totalKwh: "--" };
    }

    const startE = parseFloat(meta.meterstart) || filtered[0].energy || 0;
    const endE = parseFloat(filtered[filtered.length - 1].energy) || 0;
    const diffKwh = Math.max(0, (endE - startE) / 1000);

    const chartData = filtered.map((item) => ({
      ...item,
      // Logic to show Date if Weekly/Monthly, Time if Daily
      displayTime: viewRange === "day" 
        ? item.datetime?.split('T')[1]?.substring(0, 5) 
        : new Date(item.datetime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      current: parseFloat(item.current) || 0,
      voltage: parseFloat(item.voltage_inlet) || 0, 
      soc: parseFloat(item.soc) || 0
    }));

    return { 
      chartData, 
      hasData: true,
      totalKwh: diffKwh.toFixed(3)
    };
  }, [rawData, selectedDate, viewRange]);

  const hiddenKeys = ['timestep', 'meterstart'];

  if (loading && !rawData.points.length) return <div className="p-20 text-center animate-pulse font-black text-slate-300 italic tracking-[0.3em]">SYNCING TELEMETRY...</div>;

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen font-sans">
      <TopNavigationBar 
        onDateChange={setSelectedDate} 
        onRangeChange={setViewRange} 
      />

      <div id="analytics-report-area" className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Charger Telemetry</h1>
            <div className="flex flex-wrap gap-2">
              {Object.entries(rawData.metadata || {})
                .filter(([key]) => !hiddenKeys.includes(key.toLowerCase()))
                .map(([key, value]) => (
                  <Badge key={key} variant="outline" className="bg-slate-50 px-4 py-1.5 border-slate-100 text-slate-400 font-black text-[9px] tracking-widest uppercase">
                    {key}: {value}
                  </Badge>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-8 px-12 rounded-[2rem] text-white shadow-2xl shadow-blue-200">
             <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-2">Energy Consumed</p>
             <p className="text-4xl font-black">{processed.totalKwh} <span className="text-xs font-normal text-slate-500 italic">kWh</span></p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="Current Output (Amperes)" data={processed.chartData} dataKey="current" color="#3b82f6" hasData={processed.hasData} />
          <ChartCard title="Inlet Voltage (V)" data={processed.chartData} dataKey="voltage" color="#a855f7" hasData={processed.hasData} />
          
          <ChartCard title="Battery SoC (%)" data={processed.chartData} dataKey="soc" color="#f59e0b" hasData={processed.hasData} isArea />
          
          <Card className="rounded-[2.5rem] border-none shadow-sm h-[400px] bg-white flex flex-col p-8">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Session Energy Distribution</h3>
             <div className="flex-1 flex items-center justify-center">
                {!processed.hasData ? (
                   <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">No Energy Recorded</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{name: 'Current Session', energy: parseFloat(processed.totalKwh)}]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="energy" fill="#6366f1" radius={[20, 20, 20, 20]} barSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, data, dataKey, color, hasData, isArea = false }) {
  return (
    <Card className="rounded-[2.5rem] border-none shadow-sm h-[400px] bg-white flex flex-col p-8 transition-all hover:shadow-xl hover:shadow-slate-200/50">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">{title}</h3>
      <div className="flex-1 relative">
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
             <div className="w-10 h-0.5 bg-slate-100 rounded-full" />
             <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">Telemetry Empty</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {isArea ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="displayTime" tick={{fontSize: 9, fontWeight: 800, fill: '#cbd5e1'}} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#cbd5e1'}} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${dataKey})`} strokeWidth={4} />
              </AreaChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="displayTime" tick={{fontSize: 9, fontWeight: 800, fill: '#cbd5e1'}} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#cbd5e1'}} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={4} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}