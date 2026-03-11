"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TopNavigationBar from "@/components/TopNavigationBar";

export default function Analytics() {

  const [data, setData] = useState([]);
  const [sessions, setSessions] = useState([]);

  const VOLTAGE_MAX = 420;
  const VOLTAGE_MIN = 300;

  // Generate one day data (24 hours)
  const generateDayData = () => {
    let arr = [];
    let soc = 25;

    for (let i = 0; i < 24; i++) {

      let voltage = 360 + Math.random() * 40;
      let temperature = 28 + Math.random() * 12;
      let powerFactor = 0.85 + Math.random() * 0.15;

      if (Math.random() > 0.95) {
        voltage = 430; // occasional spike
      }

      arr.push({
        time: `${i}:00`,
        voltage: Number(voltage.toFixed(2)),
        soc: Number(soc.toFixed(2)),
        temperature: Number(temperature.toFixed(2)),
        powerFactor: Number(powerFactor.toFixed(2)),
      });

      soc += Math.random() * 3;

      if (soc > 95) soc = 95;
    }

    return arr;
  };

  // Session energy data
  const generateSessionEnergy = () => {
    let arr = [];

    for (let i = 1; i <= 8; i++) {
      arr.push({
        session: `S${i}`,
        energy: Number((5 + Math.random() * 15).toFixed(2)),
      });
    }

    return arr;
  };

  useEffect(() => {
    setData(generateDayData());
    setSessions(generateSessionEnergy());
  }, []);

  return (
    <div className="p-6 space-y-6">

      <TopNavigationBar />

      <h1 className="text-2xl font-bold">
        One Day Charger Analytics
      </h1>

      {/* Row 1 */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Energy per Session */}

        <Card>
          <CardHeader>
            <CardTitle>Energy Consumed Per Session (kWh)</CardTitle>
          </CardHeader>

          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="session" />
                <YAxis />
                <Tooltip />
                <Legend />

                <Bar
                  dataKey="energy"
                  fill="#6366f1"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Voltage */}

        <Card>
          <CardHeader>
            <CardTitle>Voltage Stability</CardTitle>
          </CardHeader>

          <CardContent className="h-80">

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>

                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="voltage"
                  stroke="#2563eb"
                  strokeWidth={3}
                />

                <ReferenceLine
                  y={VOLTAGE_MAX}
                  stroke="red"
                  strokeDasharray="5 5"
                  label="Over Voltage"
                />

                <ReferenceLine
                  y={VOLTAGE_MIN}
                  stroke="red"
                  strokeDasharray="5 5"
                  label="Under Voltage"
                />

              </LineChart>
            </ResponsiveContainer>

          </CardContent>
        </Card>

      </div>

      {/* Row 2 */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SOC Curve */}

        <Card>
          <CardHeader>
            <CardTitle>SOC Charging Curve</CardTitle>
          </CardHeader>

          <CardContent className="h-80">

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>

                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="soc"
                  stroke="#f59e0b"
                  strokeWidth={3}
                />

              </LineChart>
            </ResponsiveContainer>

          </CardContent>
        </Card>

        {/* Power Factor */}

        <Card>
          <CardHeader>
            <CardTitle>Power Factor</CardTitle>
          </CardHeader>

          <CardContent className="h-80">

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>

                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0.8, 1]} />
                <Tooltip />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="powerFactor"
                  stroke="#10b981"
                  strokeWidth={3}
                />

              </LineChart>
            </ResponsiveContainer>

          </CardContent>
        </Card>

      </div>

      {/* Row 3 */}

      <Card>

        <CardHeader>
          <CardTitle>Temperature Monitoring (°C)</CardTitle>
        </CardHeader>

        <CardContent className="h-96">

          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>

              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#ef4444"
                strokeWidth={3}
              />

            </LineChart>
          </ResponsiveContainer>

        </CardContent>

      </Card>

    </div>
  );
}