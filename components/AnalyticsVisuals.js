"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// This component fetches its own data and displays it.
export default function AnalyticsVisuals() {
  const [temperatureData, setTemperatureData] = useState([]);
  const [socData, setSocData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tempRes, socRes] = await Promise.all([
          fetch("/api/analytics/temperature"),
          fetch("/api/analytics/soc"),
        ])
        
        const tempData = await tempRes.json();
        const newSocData = await socRes.json();

        setTemperatureData(tempData);
        setSocData(newSocData);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading analytics data...</div>;
  }

  return (
    <div className="space-y-8 p-4 bg-white">
      {/* Temperature Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Temperature Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Temperature</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {temperatureData.map((entry, index) => (
                <TableRow key={`temp-${index}`}>
                  <TableCell>
                    {new Date(entry.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.temperature}°C
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SOC Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>State of Charge (SOC) Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">SOC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {socData.map((entry, index) => (
                <TableRow key={`soc-${index}`}>
                  <TableCell>
                    {new Date(entry.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{entry.soc}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}