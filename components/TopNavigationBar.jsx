// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Calendar } from "@/components/ui/calendar";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { MdDashboardCustomize, MdOutlinePayments } from "react-icons/md";
// import { IoAnalytics } from "react-icons/io5";
// import { FaFilePdf, FaCalendarDays } from "react-icons/fa6";
// import { format } from "date-fns";

// const TopNavigationBar = ({ onDateChange, onRangeChange, showControls = true }) => {
//   const pathname = usePathname();
//   const [date, setDate] = useState(new Date());
//   const [range, setRange] = useState("day");
//   const [isExporting, setIsExporting] = useState(false);

//   const buttons = [
//     { href: "/dashboard", label: "Dashboard", icon: MdDashboardCustomize },
//     { href: "/analytics", label: "Analytics", icon: IoAnalytics },
//     { href: "/reports", label: "Reports", icon: FaFilePdf },
//     { href: "/payment-plans", label: "Payments", icon: MdOutlinePayments },
//   ];

//   const handleExportPDF = async () => {
//     setIsExporting(true);
//     try {
//       const { default: jsPDF } = await import("jspdf");
//       const { default: html2canvasPro } = await import("html2canvas-pro");

//       // The IDs we defined in layout.js
//       const pages = [
//         { id: "pdf-page-dashboard", name: "Executive Dashboard" },
//         { id: "pdf-page-analytics", name: "Technical Telemetry" },
//         { id: "pdf-page-reports", name: "Sustainability & Revenue" }
//       ];

//       const pdf = new jsPDF("p", "pt", "a4");
//       const pdfWidth = pdf.internal.pageSize.getWidth();

//       for (let i = 0; i < pages.length; i++) {
//         const element = document.getElementById(pages[i].id);
        
//         if (!element) {
//           console.warn(`Page ${pages[i].id} not found in DOM`);
//           continue;
//         }

//         const canvas = await html2canvasPro(element, {
//           scale: 1.5, // Reduced slightly to prevent memory crashes on large multi-page exports
//           useCORS: true,
//           backgroundColor: "#f8fafc",
//           logging: false,
//           // Ensure we wait for animations to finish
//           onclone: (clonedDoc) => {
//             // You can force styles here if needed
//           }
//         });

//         const imgData = canvas.toDataURL("image/png");
//         const imgHeight = (canvas.height * pdfWidth) / canvas.width;

//         // Add image to the PDF page
//         pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);

//         // Add a small footer
//         pdf.setFontSize(8);
//         pdf.setTextColor(150);
//         pdf.text(`Zipsure AI - ${pages[i].name}`, 40, pdf.internal.pageSize.getHeight() - 20);

//         // Add a new page if it's not the last one
//         if (i < pages.length - 1) {
//           pdf.addPage();
//         }
//       }

//       pdf.save(`Zipsure_Full_System_Report_${new Date().toISOString().split('T')[0]}.pdf`);
//     } catch (error) {
//       console.error("Export Error:", error);
//       alert("PDF Export failed. Check if all pages are loading correctly.");
//     } finally {
//       setIsExporting(false);
//     }
//   };

  
//   return (
//     <div className="w-full pb-6">
//       <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        
//         {/* Nav Links */}
//         <nav className="flex flex-wrap items-center gap-2 p-1 bg-slate-100/50 rounded-full">
//           {buttons.map(({ href, label, icon: Icon }) => {
//             const isActive = pathname === href;
//             return (
//               <Link key={href} href={href}>
//                 <Button
//                   variant="ghost"
//                   className={`rounded-full px-6 py-2 flex items-center gap-2 transition-all ${
//                     isActive ? "bg-white text-black shadow-sm font-bold" : "text-slate-500 hover:text-black"
//                   }`}
//                 >
//                   <Icon className="text-lg" />
//                   <span className="text-sm">{label}</span>
//                 </Button>
//               </Link>
//             );
//           })}
//         </nav>

//         {showControls && (
//           <div className="flex flex-wrap items-center gap-3">
//             <Select value={range} onValueChange={(v) => { setRange(v); onRangeChange?.(v); }}>
//               <SelectTrigger className="w-[120px] rounded-full bg-white border-slate-200 shadow-sm font-semibold">
//                 <SelectValue placeholder="Range" />
//               </SelectTrigger>
//               <SelectContent className="rounded-xl">
//                 <SelectItem value="day">Daily</SelectItem>
//                 <SelectItem value="week">Weekly</SelectItem>
//                 <SelectItem value="month">Monthly</SelectItem>
//               </SelectContent>
//             </Select>

//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button variant="outline" className="rounded-full bg-white border-slate-200 shadow-sm flex gap-2 font-semibold px-5">
//                   <FaCalendarDays className="text-blue-500" />
//                   {date ? format(date, "MMM dd, yyyy") : <span>Pick Date</span>}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl" align="end">
//                 <Calendar mode="single" selected={date} onSelect={(d) => { setDate(d); onDateChange?.(d); }} />
//               </PopoverContent>
//             </Popover>

//             <Button
//               onClick={handleExportPDF}
//               disabled={isExporting}
//               className="rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg px-6 disabled:opacity-50"
//             >
//               <FaFilePdf />
//               <span className="font-bold">{isExporting ? "Generating..." : "Export PDF"}</span>
//             </Button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TopNavigationBar;
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
  const { default: jsPDF } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas-pro");

  const pdf = new jsPDF("p", "pt", "a4");
  
  // Use the unique 'print-' IDs from layout.js
  const ids = ["print-dashboard", "print-analytics", "print-reports"];

  for (let i = 0; i < ids.length; i++) {
    const element = document.getElementById(ids[i]);
    
    if (!element) {
      console.warn(`Could not find ${ids[i]}`);
      continue;
    }

    const canvas = await html2canvas(element, { 
      scale: 2, 
      useCORS: true,
      logging: false 
    });
    
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);

    if (i < ids.length - 1) {
      pdf.addPage();
    }
  }

  pdf.save("Zipsure_Full_Report.pdf");
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