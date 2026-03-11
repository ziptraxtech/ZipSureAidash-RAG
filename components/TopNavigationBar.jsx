"use client";

import { useState } from "react";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MdDashboardCustomize } from "react-icons/md";
import { IoAnalytics } from "react-icons/io5";
import { FaFilePdf } from "react-icons/fa6";
import { MdOutlinePayments } from "react-icons/md";

const TopNavigationBar = () => {
  const pathname = usePathname();

  const buttons = [
    { href: "/dashboard", label: "Dashboard", icon: MdDashboardCustomize },
    { href: "/analytics", label: "Analytics", icon: IoAnalytics },
    { href: "/reports", label: "Reports", icon: FaFilePdf },
    { href: "/payment-plans", label: "Payments", icon: MdOutlinePayments },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {buttons.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href}>
                <Button
                  className={`rounded-full px-4 py-2 flex items-center gap-2 ${
                    isActive
                      ? "bg-black text-white"
                      : "bg-white text-black border border-gray-300"
                  }`}
                >
                  <Icon
                    className={`text-lg ${
                      isActive ? "text-white" : "text-black"
                    }`}
                  />
                  {label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopNavigationBar;
