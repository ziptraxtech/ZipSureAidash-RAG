"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Zap, 
  Bell, 
  FileDown, 
  Calendar as CalendarIcon, 
} from "lucide-react";
import { IoChatbubblesOutline } from "react-icons/io5"; // Icon from your Sidebar
import { format } from "date-fns";
import { 
  SignInButton, 
  SignedIn, 
  SignedOut, 
  UserButton 
} from "@clerk/nextjs";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TopNavigationBar = ({ 
  onDateChange, 
  onRangeChange, 
  showControls = true, 
  exportId = "analytics-report-area" 
}) => {
  const pathname = usePathname();
  const [date, setDate] = useState(new Date("2026-03-13"));
  const [range, setRange] = useState("day");
  const [isExporting, setIsExporting] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/analytics", label: "Analytics" },
    { href: "/reports", label: "Reports" },
    { href: "/payment-plans", label: "Payments" },
  ];

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const { generatePDF } = await import("@/lib/pdf-generator");
      const reportArea = document.getElementById(exportId);
      const reportRef = { current: reportArea };
      await generatePDF(reportRef, setIsExporting, range);
    } catch (error) {
      console.error("PDF Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="zipsure-gradient shadow-xl border-b border-white/10 w-full no-print sticky top-0 left-0 z-50">
      <div className="w-full px-8 py-4">
        <div className="flex items-center justify-between">
          
          {/* 1. LOGO AND BRAND */}
          <div className="flex items-center space-x-4 shrink-0">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/20">
              <Zap className="text-white fill-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                ZipSureAI
              </h1>
              <p className="text-blue-100 font-medium text-sm">
                Battery Intelligence
              </p>
            </div>
          </div>
          
          {/* 2. CENTER NAVIGATION */}
          <nav className="hidden lg:flex items-center space-x-10">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link key={href} href={href} className="no-underline">
                  <span className={`text-[14px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                    isActive ? "text-white border-b-2 border-white pb-1" : "text-white/60 hover:text-white"
                  }`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* 3. ACTION CONTROLS & AUTH/CHAT */}
          <div className="flex items-center space-x-3">
            {showControls && (
              <div className="hidden xl:flex items-center space-x-3 border-r border-white/10 pr-4 mr-1">
                <Select value={range} onValueChange={(v) => { setRange(v); onRangeChange?.(v); }}>
                  <SelectTrigger className="h-13 w-[130px] bg-white/10 border-white/20 text-white text-[13px] font-black uppercase rounded-lg">
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily View</SelectItem>
                    <SelectItem value="week">Weekly Trend</SelectItem>
                    <SelectItem value="month">Monthly Audit</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-13 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg flex gap-2 font-black text-[16px] uppercase">
                      <CalendarIcon size={14} className="text-blue-200" />
                      <span>{format(date, "MMM dd, yyyy")}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl shadow-2xl border-none" align="end">
                    <Calendar mode="single" selected={date} onSelect={(d) => { if (d) { setDate(d); onDateChange?.(d); } }} />
                  </PopoverContent>
                </Popover>

                <Button onClick={handleExportPDF} disabled={isExporting} className="h-9 bg-white text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2 px-4 shadow-lg">
                  {isExporting ? <div className="h-3 w-3 border-2 border-t-blue-700 rounded-full animate-spin" /> : <FileDown size={14} />}
                  <span className="uppercase text-[13px] tracking-widest font-black">Export PDF</span>
                </Button>
              </div>
            )}

            {/* CHAT, NOTIFICATIONS & CLERK AUTH */}
            <div className="flex items-center space-x-1">
              {/* Notification Bell */}
              <button className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all relative">
                <Bell size={24} />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-blue-900" />
              </button>

              {/* NEW: AI Chat Button (Positioned to the right of Bell) */}
              <Link href="/chat">
                <button className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all relative group">
                  <IoChatbubblesOutline size={24} />
                  {/* Tooltip */}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-[8px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-black uppercase tracking-widest whitespace-nowrap">
                    AI Chat
                  </span>
                </button>
              </Link>

              {/* Clerk User Button */}
              <div className="pl-3 ml-2 border-l border-white/10">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="text-[13px] font-black uppercase tracking-widest text-white border border-white/20 px-4 py-2 rounded-xl hover:bg-white hover:text-blue-700 transition-all">
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton 
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-9 h-9 border-2 border-white/20 hover:border-white transition-all shadow-xl"
                      }
                    }}
                  />
                </SignedIn>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

export default TopNavigationBar;