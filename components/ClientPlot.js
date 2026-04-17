// components/ClientPlot.js
"use client";

import dynamic from "next/dynamic";

// Plotly is ~3MB — load only when the component is actually rendered
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-100 animate-pulse rounded-xl" />,
});

export default Plot;
