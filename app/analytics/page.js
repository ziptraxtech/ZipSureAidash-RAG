"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, AreaChart, Area
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Battery, Zap, Clock } from 'lucide-react';

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
    if (rawId === "9") return "sapna_charger";
    const num = parseInt(rawId);
    if (num >= 2 && num <= 8) return `device${num}`;
    return rawId;
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

    const sessions = [];
    const GAP_LIMIT = 30 * 60 * 1000; 
    let currentSessionPoints = [];

    filtered.forEach((p, index) => {
      if (index === 0) {
        currentSessionPoints.push(p);
      } else {
        const prevTime = new Date(filtered[index - 1].datetime).getTime();
        const currTime = new Date(p.datetime).getTime();
        if (currTime - prevTime > GAP_LIMIT) {
          const startE = currentSessionPoints[0].energy || 0;
          const endE = currentSessionPoints[currentSessionPoints.length - 1].energy || 0;
          sessions.push({ name: `Sess ${sessions.length + 1}`, kwh: Math.max(0, (endE - startE) / 1000) });
          currentSessionPoints = [p];
        } else {
          currentSessionPoints.push(p);
        }
      }
    });

    if (currentSessionPoints.length > 0) {
      const startE = currentSessionPoints[0].energy || 0;
      const endE = currentSessionPoints[currentSessionPoints.length - 1].energy || 0;
      sessions.push({ name: `Sess ${sessions.length + 1}`, kwh: Math.max(0, (endE - startE) / 1000) });
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

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-300 tracking-widest uppercase italic">Syncing Terminal {rawId}...</div>;

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans">
      <TopNavigationBar onDateChange={setSelectedDate} onRangeChange={setViewRange} exportId="analytics-report-area"/>
      <div id="analytics-report-area" className="p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Charger Analytics</h1>
            <p className="text-slate-500 text-sm font-medium">Real-time performance monitoring for Device {rawId}</p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2">
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">ID: ZIP-UNIT-0{rawId}</Badge>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                {deviceId === "sapna_charger" ? "Terminal: Okhla Phase III" : "Terminal: Remote Unit"}
              </Badge>
            </div>
          </div>
          <div className="bg-[#0F172A] p-8 rounded-2xl text-white shadow-xl min-w-[280px] text-center lg:text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Total Energy Consumed</p>
            <p className="text-5xl font-bold tracking-tighter">{processed.totalKwh} <span className="text-lg font-normal text-slate-400 ml-2">{processed.unit}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="Current Output (Amperes)" data={processed.chartData} dataKey="current" color="#3B82F6" icon={<Activity size={20} />} iconBg="bg-blue-600" hasData={processed.hasData} viewRange={viewRange} />
          <ChartCard title="Inlet Voltage (V)" data={processed.chartData} dataKey="voltage" color="#8B5CF6" icon={<Zap size={20} />} iconBg="bg-purple-600" hasData={processed.hasData} viewRange={viewRange} />
          <ChartCard title="Battery Health (SoC %)" data={processed.chartData} dataKey="soc" color="#10B981" icon={<Battery size={20} />} iconBg="bg-emerald-600" hasData={processed.hasData} isArea viewRange={viewRange} />
          <ChartCard title="Energy Consumed per Session" data={processed.sessionData} dataKey="energy" color="#6366f1" icon={<Clock size={20} />} iconBg="bg-indigo-600" hasData={processed.hasData} isBar unit={processed.sessionUnit} viewRange={viewRange} />
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  return (
    <Suspense fallback={<div className="p-20 text-center uppercase font-black text-slate-300">Loading Analytics...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}

function ChartCard({ title, data, dataKey, color, icon, iconBg, hasData, isArea = false, isBar = false, unit = "", viewRange = "day" }) {
  return (
    <Card className="rounded-3xl border-none shadow-lg shadow-slate-200/50 h-[450px] bg-white flex flex-col p-8 transition-transform hover:scale-[1.01]">
      <div className="flex items-center mb-8 justify-between">
        <div className="flex items-center">
          <div className={`${iconBg} p-2.5 rounded-xl text-white shadow-md mr-4`}>{icon}</div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
        </div>
        {isBar && hasData && <Badge variant="outline" className="text-[10px] font-bold text-slate-400 uppercase">UNIT: {unit}</Badge>}
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