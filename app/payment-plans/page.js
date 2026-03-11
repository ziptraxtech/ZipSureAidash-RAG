"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TopNavigationBar from "@/components/TopNavigationBar";
import { FaSearch, FaCalendarAlt } from "react-icons/fa";
import { ResponsiveContainer } from "recharts";
import Image from "next/image";
import QRCode from "react-qr-code";

const creditCards = [
  {
    name: "John Doe",
    number: "**** **** **** 1234",
    expiry: "12/26",
    brand: "Mastercard",
  },
  {
    name: "Jane Smith",
    number: "**** **** **** 5678",
    expiry: "11/25",
    brand: "Mastercard",
  },
  {
    name: "Alex Lee",
    number: "**** **** **** 9012",
    expiry: "01/27",
    brand: "Mastercard",
  },
  {
    name: "AB Rock",
    number: "**** **** **** 7005",
    expiry: "01/27",
    brand: "Mastercard",
  },
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

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setStatus("Uploading...");

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      setStatus("File uploaded successfully. Please send an email to info@zipsureai.com informing us of the same.");
    } else {
      setStatus("Upload failed.");
    }
  };
  return (
    <div className="p-6 space-y-6">
      {/* Top Row: Header and Menu */}
      <TopNavigationBar />
      {/* Top Row: Header and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          ZIP Sure AI Diagnostics Dashboard
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <FaSearch className="text-gray-600" />
          <FaCalendarAlt className="text-gray-600" />
          <Badge className="bg-gray-200 text-gray-700">2025-05-01</Badge>
          <Badge className="bg-gray-200 text-gray-700">2025-05-15</Badge>
          <Button className="rounded-full px-4 py-2">Export to PDF</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-4">
        <div
          style={{
            height: "auto",
            margin: "0 auto",
            maxWidth: 256,
            width: "100%",
          }}
        >
          <QRCode
            size={1024}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            value={"100"}
            viewBox={`0 0 1024 1024`}
          />
        </div>
        <div className="p-6 space-y-4">
          <div className="p-6 max-w-md mx-auto">
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
            <Button
              onClick={handleUpload}
              className="bg-black text-white rounded-full w-full py-2 mt-4"
              disabled={!file}
            >
              Upload
            </Button>
            <p className="mt-4">{status}</p>
          </div>
        </div>
      </div>

      {/* Row with Horizontal and Vertical Bar Charts */}
      <div className="grid grid-cols-1">
        {/* Credit Card Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {creditCards.map((card, index) => (
            <Card
              key={index}
              className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold">{card.brand}</span>
                <Image
                  src="/mastercard-logo.jpeg"
                  alt="Mastercard"
                  width={50}
                  height={30}
                />
              </div>
              <div className="text-2xl font-bold tracking-widest mb-4">
                {card.number}
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-xs uppercase">Card Holder</p>
                  <p>{card.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase">Expiry Date</p>
                  <p>{card.expiry}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-y-auto max-h-96">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="py-2">Name</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Size</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((item, index) => (
                  <tr
                    key={index}
                    className="bg-white text-black shadow-sm rounded-md my-2 mt-2 mb-2"
                  >
                    <td className="py-3 px-2">{item?.name}</td>
                    <td className="py-3 px-2">{item?.status}</td>
                    <td className="py-3 px-2">{item?.size}</td>
                    <td className="py-3 px-2">{"10-05-2025"}</td>
                    <td className="py-3 px-2">{item?.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
