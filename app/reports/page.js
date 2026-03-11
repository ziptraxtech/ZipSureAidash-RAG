// "use client";

// import { useState, useEffect } from "react";
// import TopNavigationBar from "@/components/TopNavigationBar";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// export default function ReportsPage() {
//   const [range, setRange] = useState("day");

//   const [data, setData] = useState({
//     sessions: 0,
//     duration: "",
//     revenue: 0,
//     netIncome: 0,
//   });

//   const generateRandomData = () => {
//     let sessions;

//     if (range === "day") {
//       sessions = Math.floor(Math.random() * 40) + 20;
//     }

//     if (range === "week") {
//       sessions = Math.floor(Math.random() * 250) + 150;
//     }

//     if (range === "month") {
//       sessions = Math.floor(Math.random() * 900) + 600;
//     }

//     const avgDuration = Math.floor(Math.random() * 30) + 30;

//     const revenue = sessions * (Math.random() * 12 + 8);

//     const netIncome = revenue * (0.65 + Math.random() * 0.15);

//     return {
//       sessions,
//       duration: `${avgDuration} min`,
//       revenue: revenue.toFixed(2),
//       netIncome: netIncome.toFixed(2),
//     };
//   };

//   useEffect(() => {
//     setData(generateRandomData());
//   }, [range]);

//   return (
//     <div className="p-6 space-y-6">

//       <TopNavigationBar />

//       {/* Header + Selector */}

//       <div className="flex justify-between items-center flex-wrap gap-4">

//         <h1 className="text-2xl font-bold text-gray-900">
//           ZIP Sure AI Diagnostics Dashboard
//         </h1>

//         <div className="flex gap-2">

//           <button
//             onClick={() => setRange("day")}
//             className={`px-4 py-2 rounded-full ${
//               range === "day" ? "bg-black text-white" : "bg-gray-200"
//             }`}
//           >
//             Day
//           </button>

//           <button
//             onClick={() => setRange("week")}
//             className={`px-4 py-2 rounded-full ${
//               range === "week" ? "bg-black text-white" : "bg-gray-200"
//             }`}
//           >
//             Week
//           </button>

//           <button
//             onClick={() => setRange("month")}
//             className={`px-4 py-2 rounded-full ${
//               range === "month" ? "bg-black text-white" : "bg-gray-200"
//             }`}
//           >
//             Month
//           </button>

//         </div>
//       </div>

//       {/* KPI Cards */}

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

//         <Card>
//           <CardHeader>
//             <CardTitle>Total Sessions</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <p className="text-3xl font-bold">{data.sessions}</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Avg Session Duration</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <p className="text-3xl font-bold">{data.duration}</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Revenue Generated</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <p className="text-3xl font-bold">₹{data.revenue}</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Net Income</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <p className="text-3xl font-bold">₹{data.netIncome}</p>
//           </CardContent>
//         </Card>

//       </div>

//     </div>
//   );
// }
"use client";

import { useState, useEffect, useRef } from "react";
import TopNavigationBar from "@/components/TopNavigationBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import DatePicker from "react-datepicker";

export default function ReportsPage() {

  const reportRef = useRef(null);

  const [range, setRange] = useState("day");

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [kpi, setKpi] = useState({
    sessions: 0,
    duration: "",
    revenue: 0,
    netIncome: 0,
  });

  const [chartData, setChartData] = useState([]);

  const generateData = () => {

    let points = 24;

    if (range === "week") points = 7;
    if (range === "month") points = 30;

    let sessions = 0;

    const data = Array.from({ length: points }).map((_, i) => {

      const revenue = Math.random() * 200 + 100;

      const ses = Math.floor(Math.random() * 10 + 5);

      sessions += ses;

      return {
        name: range === "day" ? `${i}:00` : `D${i + 1}`,
        revenue: Number(revenue.toFixed(2)),
        sessions: ses
      };
    });

    const avgDuration = Math.floor(Math.random() * 25 + 30);

    const revenueTotal = data.reduce((acc, d) => acc + d.revenue, 0);

    const netIncome = revenueTotal * (0.65 + Math.random() * 0.15);

    setKpi({
      sessions,
      duration: `${avgDuration} min`,
      revenue: revenueTotal.toFixed(2),
      netIncome: netIncome.toFixed(2)
    });

    setChartData(data);
  };

  useEffect(() => {

    generateData();

    const interval = setInterval(() => {
      generateData();
    }, 10000); // auto refresh every 10 seconds

    return () => clearInterval(interval);

  }, [range]);


  const generatePDF = async () => {
  if (!reportRef.current) return;

  const canvas = await html2canvas(reportRef.current, {
    scale: 2,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const imgWidth = 210;
  const pageHeight = 295;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save("EV_Charging_Report.pdf");
};
  return (

    <div className="p-6 space-y-6">

      <TopNavigationBar />

      {/* HEADER */}

      <div className="flex flex-wrap justify-between items-center gap-4">

        <h1 className="text-2xl font-bold">
          ZIP Sure AI Diagnostics Reports
        </h1>

        {/* SELECTORS */}

        <div className="flex flex-wrap gap-3 items-center">

          {["day","week","month"].map((type)=>(
            <button
              key={type}
              onClick={()=>setRange(type)}
              className={`px-4 py-2 rounded-full capitalize ${
                range===type
                  ? "bg-black text-white"
                  : "bg-gray-200"
              }`}
            >
              {type}
            </button>
          ))}

          {/* DATE PICKER */}

          <DatePicker
            selected={startDate}
            onChange={(date)=>setStartDate(date)}
            className="border px-3 py-2 rounded"
          />

          <DatePicker
            selected={endDate}
            onChange={(date)=>setEndDate(date)}
            className="border px-3 py-2 rounded"
          />

          <button
            onClick={generatePDF}
            className="bg-blue-600 text-white px-4 py-2 rounded-full"
          >
            Export PDF
          </button>

        </div>

      </div>

      {/* REPORT AREA */}

      <div ref={reportRef} className="space-y-8">

        {/* KPI CARDS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <Card>
            <CardHeader>
              <CardTitle>Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{kpi.sessions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avg Session Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{kpi.duration}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">₹{kpi.revenue}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Net Income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">₹{kpi.netIncome}</p>
            </CardContent>
          </Card>

        </div>

        {/* CHARTS */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Card>

            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>

            <CardContent className="h-80">

              <ResponsiveContainer width="100%" height="100%">

                <LineChart data={chartData}>

                  <CartesianGrid strokeDasharray="3 3"/>

                  <XAxis dataKey="name"/>

                  <YAxis/>

                  <Tooltip/>

                  <Legend/>

                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={3}
                  />

                </LineChart>

              </ResponsiveContainer>

            </CardContent>

          </Card>

          <Card>

            <CardHeader>
              <CardTitle>Sessions Over Time</CardTitle>
            </CardHeader>

            <CardContent className="h-80">

              <ResponsiveContainer width="100%" height="100%">

                <BarChart data={chartData}>

                  <CartesianGrid strokeDasharray="3 3"/>

                  <XAxis dataKey="name"/>

                  <YAxis/>

                  <Tooltip/>

                  <Legend/>

                  <Bar
                    dataKey="sessions"
                    fill="#10b981"
                  />

                </BarChart>

              </ResponsiveContainer>

            </CardContent>

          </Card>

        </div>

      </div>

    </div>
  );
}