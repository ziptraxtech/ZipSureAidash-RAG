"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LiveIndicator from "../../components/LiveIndicator";
import { FaSearch, FaCalendarAlt } from "react-icons/fa";
import TopNavigationBar from "../../components/TopNavigationBar";
import ChargerMap from "../../components/ChargerMap";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";


// STATE OF HEALTH DATA
const stateOfHealthData = [
  { name: "Healthy", value: 92 },
  { name: "Degraded", value: 8 },
];

const COLORS_HEALTH = ["#10b981", "#ef4444"];
const currentPower = 823;
const voltage = 259;
const revenue = 4200;
const sessionTime = "00:24:10";


const chargerStatus = {
  online: 1,
  offline: 0,
  charging: 1,
  maintenance: 0,
};


const chargerDetails = {
  address: "Sector 17 Market, Chandigarh, India",
  status: "Online",
};


export default function DashboardPage() {

  return (
    <div className="p-6 space-y-6">

      <TopNavigationBar />



      {/* HEADER */}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">

        <h1 className="text-2xl font-bold">
          EV Charger B2B Dashboard
        </h1>

        <div className="flex items-center gap-3">

          <FaSearch />
          <FaCalendarAlt />

          <Badge className="bg-black text-white px-4 py-2 rounded-full">
            2026-03-01
          </Badge>

          <Badge className="bg-black text-white px-4 py-2 rounded-full">
            2026-03-07
          </Badge>

          <Button className="bg-white text-black rounded-full">
            Export
          </Button>

        </div>

      </div>



      {/* KPI CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">


        {/* STATE OF HEALTH */}

        <Card>

          <CardHeader>
            <CardTitle>State of Health</CardTitle>
          </CardHeader>

          <CardContent className="h-40">

            <ResponsiveContainer width="100%" height="100%">

              <PieChart>

                <Pie
                  data={stateOfHealthData}
                  dataKey="value"
                  outerRadius={60}
                  label
                >

                  {stateOfHealthData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS_HEALTH[index]}
                    />
                  ))}

                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>

          </CardContent>

        </Card>



        {/* CURRENT POWER */}

        <Card>

          <CardHeader>
                <CardTitle>Current Power</CardTitle>

          <LiveIndicator />
          </CardHeader>

          <CardContent className="text-3xl font-bold text-blue-600">
            {currentPower} W
          </CardContent>

        </Card>



        {/* REVENUE */}

        <Card>

          <CardHeader>
            <CardTitle>Revenue Generated</CardTitle>
          </CardHeader>

          <CardContent className="text-3xl font-bold text-green-600">
            ₹ {revenue}
          </CardContent>

        </Card>



        {/* VOLTAGE */}

        <Card>

          <CardHeader>
            <CardTitle>Voltage</CardTitle>
          </CardHeader>

          <CardContent className="text-3xl font-bold text-purple-600">
            {voltage} V
          </CardContent>

        </Card>



        {/* CURRENT SESSION TIME */}

        <Card>

          <CardHeader>
            <CardTitle>Current Session Time</CardTitle>
          </CardHeader>

          <CardContent className="text-3xl font-bold text-orange-600">
            {sessionTime}
          </CardContent>

        </Card>

      </div>



      {/* CHARGER STATUS + DETAILS */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


        {/* CHARGER OCCUPANCY */}

        <Card>

          <CardHeader>
            <CardTitle>Charger Occupancy</CardTitle>
          </CardHeader>

          <CardContent>

            <div className="grid grid-cols-2 gap-4 text-center">

              <div className="p-4 bg-green-100 rounded-lg">
                <p className="text-sm">Online</p>
                <p className="text-2xl font-bold text-green-600">
                  {chargerStatus.online}
                </p>
              </div>

              <div className="p-4 bg-red-100 rounded-lg">
                <p className="text-sm">Offline</p>
                <p className="text-2xl font-bold text-red-600">
                  {chargerStatus.offline}
                </p>
              </div>

              <div className="p-4 bg-blue-100 rounded-lg">
                <p className="text-sm">Charging</p>
                <p className="text-2xl font-bold text-blue-600">
                  {chargerStatus.charging}
                </p>
              </div>

              <div className="p-4 bg-yellow-100 rounded-lg">
                <p className="text-sm">Under Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {chargerStatus.maintenance}
                </p>
              </div>

            </div>

          </CardContent>

        </Card>



        {/* CHARGER DETAILS */}

        <Card>

          <CardHeader>
            <CardTitle>Charger Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">


            {/* ADDRESS */}

            <div>

              <p className="text-sm text-gray-500">
                Address
              </p>

              <div className="flex items-center gap-3">

                <p className="font-medium">
                  {chargerDetails.address}
                </p>

                <Badge
                  className={`${
                    chargerDetails.status === "Online"
                      ? "bg-green-600"
                      : "bg-red-600"
                  } text-white`}
                >
                  {chargerDetails.status}
                </Badge>

              </div>

            </div>



            {/* GOOGLE MAP */}

            <div>

              <p className="text-sm text-gray-500 mb-2">
                Location of the Charger
              </p>

              <ChargerMap />

            </div>

          </CardContent>

        </Card>

      </div>

    </div>
  );
}