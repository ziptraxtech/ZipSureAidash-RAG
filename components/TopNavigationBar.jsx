"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MdDashboardCustomize, MdOutlinePayments } from "react-icons/md";
import { IoAnalytics } from "react-icons/io5";
import { FaFilePdf, FaCalendarDays } from "react-icons/fa6";
import { format, isSameDay } from "date-fns";

const TopNavigationBar = ({ onDateChange, onRangeChange, showControls = true, exportId = "analytics-report-area" }) => {
  const pathname = usePathname();
  
  // Set default to March 13, 2026 to match your current data.json
  const [date, setDate] = useState(new Date("2026-03-13"));
  const [range, setRange] = useState("day");
  const [isExporting, setIsExporting] = useState(false);

  const buttons = [
    { href: "/dashboard", label: "Dashboard", icon: MdDashboardCustomize },
    { href: "/analytics", label: "Analytics", icon: IoAnalytics },
    { href: "/reports", label: "Reports", icon: FaFilePdf },
    { href: "/payment-plans", label: "Payments", icon: MdOutlinePayments },
  ];

  // Helper to find the active label for the PDF filename
  const activeLabel = buttons.find(btn => btn.href === pathname)?.label || "Report";

  const handleExportPDF = async () => {
    setIsLoading(true);
    const { generateReport } = await import("@/lib/pdf-generator");
    const printIds = ["print-dashboard", "print-analytics", "print-reports"];
    await generateReport(printIds);
    setIsLoading(false);
  };

  return (
    <div className="w-full pb-6 no-print">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        
        {/* Navigation Links */}
        <nav className="flex flex-wrap items-center gap-2 p-1 bg-slate-100/50 rounded-full border border-slate-200/50">
          {buttons.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  className={`rounded-full px-6 py-2 flex items-center gap-2 transition-all duration-300 ${
                    isActive 
                      ? "bg-white text-blue-600 shadow-md font-bold scale-105" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Icon className={`text-lg ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span className="text-sm uppercase tracking-tight">{label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {showControls && (
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Time Range Selector */}
            <Select 
              value={range} 
              onValueChange={(v) => { 
                setRange(v); 
                onRangeChange?.(v); 
              }}
            >
              <SelectTrigger className="w-[130px] rounded-full bg-white border-slate-200 shadow-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                <SelectItem value="day" className="font-medium">Daily View</SelectItem>
                <SelectItem value="week" className="font-medium">Weekly Trend</SelectItem>
                <SelectItem value="month" className="font-medium">Monthly Audit</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Picker Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={`rounded-full bg-white border-slate-200 shadow-sm flex gap-3 font-bold px-6 transition-all ${
                    !isSameDay(date, new Date("2026-03-13")) ? "border-amber-200 bg-amber-50/30" : ""
                  }`}
                >
                  <FaCalendarDays className="text-blue-500" />
                  <span className="text-slate-700">{format(date, "MMM dd, yyyy")}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl bg-white overflow-hidden" align="end">
                <Calendar 
                  mode="single" 
                  selected={date} 
                  onSelect={(d) => { 
                    if (d) {
                      setDate(d); 
                      onDateChange?.(d); 
                    }
                  }} 
                  className="p-4"
                />
              </PopoverContent>
            </Popover>

            {/* Export Button */}
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="rounded-full bg-slate-900 hover:bg-black text-white flex items-center gap-2 shadow-xl px-8 h-10 transition-all active:scale-95 disabled:opacity-50"
            >
              {isExporting ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FaFilePdf className="text-blue-400" />
              )}
              <span className="font-bold uppercase text-[11px] tracking-widest">
                {isExporting ? "Generating..." : "Export PDF"}
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopNavigationBar;