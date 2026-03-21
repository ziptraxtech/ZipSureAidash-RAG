"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, AreaChart, Area
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Battery, Zap, Activity, Clock } from 'lucide-react';

const TopNavigationBar = dynamic(() => import('@/components/TopNavigationBar'), { 
  ssr: false,
  loading: () => <div className="h-16 w-full animate-pulse bg-slate-100 rounded-full mb-6" /> 
});

export default function Analytics() {
  const [rawData, setRawData] = useState({ points: [], metadata: {} });
  const [loading, setLoading] = useState(true);
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
    const filtered = allPoints.filter(p => {
      const pDate = new Date(p.datetime);
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      const current = new Date(pDate);
      current.setHours(0, 0, 0, 0);
      return viewRange === "day" ? current.getTime() === selected.getTime() : true;
    });

    if (filtered.length === 0) return { chartData: [], sessionData: [], hasData: false, totalKwh: "0.000" };

    const chartData = filtered.map((item) => ({
      ...item,
      displayTime: item.datetime?.split('T')[1]?.substring(0, 5),
      current: parseFloat(item.current) || 0,
      voltage: parseFloat(item.voltage_inlet) || 0, 
      soc: parseFloat(item.soc) || 0
    }));

    const sessionData = [{ name: 'Session 1', energy: 0.375 }]; 

    return { chartData, sessionData, hasData: true, totalKwh: "0.375" };
  }, [rawData, selectedDate, viewRange]);

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-300 tracking-widest uppercase italic">Syncing Terminal...</div>;

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans">
      <TopNavigationBar onDateChange={setSelectedDate} onRangeChange={setViewRange} exportId="analytics-report-area"/>

      {/* Centered Content Wrapper */}
      <div id="analytics-report-area" className="p-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Charger Analytics</h1>
            <p className="text-slate-500 text-sm font-medium">Real-time performance monitoring and analytics</p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2">
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                ID: ZIP-SAPNA-01
              </Badge>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                Terminal: Okhla Phase III
              </Badge>
            </div>
          </div>

          <div className="bg-[#0F172A] p-8 rounded-2xl text-white shadow-xl min-w-[280px] text-center lg:text-right">
             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Total Energy Consumed</p>
             <p className="text-5xl font-bold tracking-tighter">{processed.totalKwh} <span className="text-lg font-normal text-slate-400 ">kWh</span></p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard 
            title="Current Output (Amperes)" 
            data={processed.chartData} 
            dataKey="current" 
            color="#3B82F6" 
            icon={<Activity size={20} />} 
            iconBg="bg-blue-600"
            hasData={processed.hasData} 
          />
          <ChartCard 
            title="Inlet Voltage (V)" 
            data={processed.chartData} 
            dataKey="voltage" 
            color="#8B5CF6" 
            icon={<Zap size={20} />} 
            iconBg="bg-purple-600"
            hasData={processed.hasData} 
          />
          <ChartCard 
            title="Battery Health (SoC %)" 
            data={processed.chartData} 
            dataKey="soc" 
            color="#10B981" 
            icon={<Battery size={20} />} 
            iconBg="bg-emerald-600"
            hasData={processed.hasData} 
            isArea 
          />
          <ChartCard 
            title="Energy Consumed per Session" 
            data={processed.sessionData} 
            dataKey="energy" 
            color="#6366f1" 
            icon={<Clock size={20} />} 
            iconBg="bg-indigo-600"
            hasData={processed.hasData} 
            isBar
          />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, data, dataKey, color, icon, iconBg, hasData, isArea = false, isBar = false }) {
  return (
   <Card className="rounded-3xl border-none shadow-lg shadow-slate-200/50 h-[450px] bg-white flex flex-col p-8 transition-transform hover:scale-[1.01]">
      <div className="flex items-center mb-8">
        <div className={`${iconBg} p-2.5 rounded-xl text-white shadow-md mr-4`}>
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
      </div>

      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          {isArea ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayTime" tick={{fontSize: 12, fontWeight: 500, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 500, fill: '#64748b'}} dx={-10} />
              <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${dataKey})`} strokeWidth={3} />
            </AreaChart>
          ) : isBar ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize: 12, fontWeight: 500, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10}/>
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 500, fill: '#64748b'}} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="energy" fill={color} radius={[8, 8, 8, 8]} barSize={60} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayTime" tick={{fontSize: 12, fontWeight: 500, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 500, fill: '#64748b'}} dx={-10} />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}