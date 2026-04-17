"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Zap,
  Bell,
  FileDown,
  Calendar as CalendarIcon,
  Menu
} from "lucide-react";
import { IoChatbubblesOutline } from "react-icons/io5";
import { format } from "date-fns";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const TopNavigationBar = ({
  onDateChange,
  onRangeChange,
  showControls = true,
  showChat = true,
  exportId = "analytics-report-area"
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const rawId = searchParams.get("device") || "9";
  const [date, setDate] = useState(new Date());
  const [range, setRange] = useState("day");
  const [isExporting, setIsExporting] = useState(false);

  const navLinks = [
    { href: `/stations/dashboard?device=${rawId}`, label: "Overview" },
    { href: `/stations/analytics?device=${rawId}`, label: "Analytics" },
    { href: `/stations/reports?device=${rawId}`, label: "Reports" },
    { href: `/stations/payment-plans?device=${rawId}`, label: "Payments" },
  ];

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const { generatePDF } = await import("@/lib/pdf-generator");
      const reportArea = document.getElementById(exportId);

      if (reportArea) {
        const originalStyle = reportArea.style.cssText;
        reportArea.style.width = "1280px";
        reportArea.style.minWidth = "1280px";
        reportArea.classList.add("force-desktop-export");
        const reportRef = { current: reportArea };
        await new Promise((resolve) => setTimeout(resolve, 100));
        await generatePDF(reportRef, setIsExporting, range);
        reportArea.style.cssText = originalStyle;
        reportArea.classList.remove("force-desktop-export");
      }
    } catch (error) {
      console.error("PDF Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="zipsure-gradient shadow-xl border-b border-white/10 w-full no-print sticky top-0 left-0 z-50">
      <div className="w-full px-4 md:px-8 py-4">
        <div className="flex items-center justify-between gap-2">

          {/* 1. LEFT: LOGO & MOBILE MENU */}
          <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
            <div className="lg:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="p-2 text-white hover:bg-white/10">
                    <Menu size={24} />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] bg-[#0f172a] border-white/10 p-6 text-white">
                  <SheetTitle className="text-white flex items-center gap-3 mb-8">
                    <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                      <Zap className="text-blue-400 fill-blue-400" size={22} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xl font-bold tracking-tight leading-none">ZipSureAI</span>
                      <span className="text-blue-300 font-medium text-[11px] uppercase tracking-wider mt-1">Battery Intelligence</span>
                    </div>
                  </SheetTitle>
                  <nav className="flex flex-col space-y-6">
                    {navLinks.map(({ href, label }) => (
                      <Link key={href} href={href} onClick={() => setIsOpen(false)} className="text-lg font-bold uppercase tracking-widest text-white/70 hover:text-white">
                        {label}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
            <div className="flex items-center space-x-4 shrink-0">
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/20">
                <Zap className="text-white fill-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">ZipSureAI</h1>
                <p className="text-blue-100 font-medium text-sm">Battery Intelligence</p>
              </div>
            </div>
          </div>

          {/* 2. CENTER: DESKTOP NAV */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href.split('?')[0] || pathname.startsWith(href.split('?')[0]);
              return (
                <Link key={href} href={href} className="no-underline">
                  <span className={`font-medium transition-colors duration-200 ${
                    isActive ? "text-white border-b-2 border-white pb-1" : "text-white/90 hover:text-white"
                  }`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* 3. RIGHT: ACTION CONTROLS */}
          <div className="flex items-center space-x-1 md:space-x-3">
            {showControls && (
              <div className="flex items-center space-x-1 md:space-x-2">
                {/* Range Selector */}
                <div className="hidden sm:block">
                  <Select value={range} onValueChange={(v) => { setRange(v); onRangeChange?.(v); }}>
                    <SelectTrigger className="h-9 w-[110px] bg-white/10 border-white/20 text-white text-[11px] font-black uppercase">
                      <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Daily</SelectItem>
                      <SelectItem value="week">Weekly</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Calendar */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-9 px-2 md:px-3 text-white/80 hover:bg-white/10 flex gap-2 font-black uppercase text-[12px]">
                      <CalendarIcon size={18} className="text-blue-200" />
                      <span className="hidden md:inline">{format(date, "MMM dd, yyyy")}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar mode="single" selected={date} onSelect={(d) => { if (d) { setDate(d); onDateChange?.(d); } }} />
                  </PopoverContent>
                </Popover>

                {/* Export Button */}
                <Button onClick={handleExportPDF} disabled={isExporting} className="h-9 bg-white text-blue-700 hover:bg-blue-50 px-3 md:px-4 rounded-lg flex items-center shadow-lg transition-transform active:scale-95">
                  {isExporting ? <div className="h-3 w-3 border-2 border-t-blue-700 rounded-full animate-spin" /> : <FileDown size={16} />}
                  <span className="hidden sm:inline uppercase text-[11px] font-black ml-2">Export PDF</span>
                </Button>
              </div>
            )}

            {/* Chat */}
            {showChat && (
              <div className="flex items-center space-x-1 border-l border-white/10 pl-2">
                <Link href={`/stations/chat?device=${rawId}`}>
                  <button className="p-2 text-white/70 hover:text-white"><IoChatbubblesOutline size={22} /></button>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default TopNavigationBar;
