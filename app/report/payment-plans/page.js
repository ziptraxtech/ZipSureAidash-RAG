"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import Image from "next/image";
import QRCode from "react-qr-code";

// 1. DYNAMIC IMPORT: Prevent hydration mismatches and PDF library collisions
const TopNavigationBar = dynamic(() => import('@/components/TopNavigationBar'), { 
  ssr: false,
  loading: () => <div className="h-16 w-full animate-pulse bg-slate-100 rounded-full mb-6" /> 
});

const creditCards = [
  { name: "John Doe", number: "**** **** **** 1234", expiry: "12/26", brand: "Mastercard" },
  { name: "Jane Smith", number: "**** **** **** 5678", expiry: "11/25", brand: "Mastercard" },
  { name: "Alex Lee", number: "**** **** **** 9012", expiry: "01/27", brand: "Mastercard" },
  { name: "AB Rock", number: "**** **** **** 7005", expiry: "01/27", brand: "Mastercard" },
];

const tableData = Array.from({ length: 10 }, (_, i) => ({
  name: `File_${i + 1}.pdf`,
  status: i % 2 === 0 ? "Completed" : "Pending",
  size: "10 MB",
  date: "2025-05-15",
  time: `${10 + i}:00 AM`,
}));

export default function PaymentPlansPage() {
  const { user } = useUser();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  
  // 2. UNIVERSAL STATES: Sync with Navbar (even if not filtering yet, avoids errors)
  const [selectedDate, setSelectedDate] = useState(new Date("2026-03-13"));
  const [viewRange, setViewRange] = useState("day");

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setStatus("Uploading...");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setStatus("File uploaded successfully. Please email info@zipsureai.com.");
      } else {
        setStatus("Upload failed.");
      }
    } catch (err) {
      setStatus("Error during upload.");
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* 3. SYNCED NAVBAR: Handles Search, Date, and Export logic */}
      <TopNavigationBar 
        onDateChange={setSelectedDate} 
        onRangeChange={setViewRange} 
      />

      {/* 4. PDF TARGET ID: Matches your MasterExportTemplate/Layout logic */}
      <div id="print-payment-plans" className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
            Subscription & Plans
          </h1>
          <Badge className="bg-white text-slate-400 border-slate-200 uppercase text-[10px] font-bold px-4 py-1 shadow-sm">
            Billing Profile
          </Badge>
        </div>

        {/* QR & Upload Section */}
        <div className="grid lg:grid-cols-2 gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center justify-center bg-slate-50 rounded-3xl p-6 border border-dashed border-slate-200">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Scan for Payment</p>
             <QRCode
                size={180}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                value={"100"}
                viewBox={`0 0 1024 1024`}
              />
          </div>
          
          <div className="flex flex-col justify-center space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Upload Invoice / Proof</h3>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <Button
              onClick={handleUpload}
              className="bg-slate-900 text-white rounded-2xl w-full py-6 font-black uppercase tracking-widest hover:bg-black transition-all"
              disabled={!file}
            >
              Submit Documentation
            </Button>
            {status && <p className="text-[10px] font-bold text-blue-600 uppercase text-center mt-2">{status}</p>}
          </div>
        </div>

        {/* Credit Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditCards.map((card, index) => (
            <div
              key={index}
              className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden transition-transform hover:scale-[1.02]"
            >
              {/* Card Decoration */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full" />
              
              <div className="flex justify-between items-start mb-10">
                <span className="text-[10px] font-black tracking-widest uppercase opacity-60">{card.brand}</span>
                <div className="w-10 h-7 bg-amber-400/20 rounded-md border border-amber-400/30" />
              </div>
              
              <div className="text-xl font-bold tracking-[0.2em] mb-8 font-mono">
                {card.number}
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[8px] uppercase opacity-40 font-black mb-1">Holder</p>
                  <p className="text-xs font-bold uppercase tracking-tighter">{card.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase opacity-40 font-black mb-1">Expires</p>
                  <p className="text-xs font-bold">{card.expiry}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table Section */}
        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Document Registry</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">
                    <th className="px-8 py-4">File Name</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4">Size</th>
                    <th className="px-8 py-4">Processed Date</th>
                    <th className="px-8 py-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tableData.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4 text-xs font-bold text-slate-700">{item.name}</td>
                      <td className="px-8 py-4">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full ${
                          item.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-xs text-slate-400">{item.size}</td>
                      <td className="px-8 py-4 text-xs text-slate-400">2025-05-15</td>
                      <td className="px-8 py-4 text-xs text-slate-400">{item.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}