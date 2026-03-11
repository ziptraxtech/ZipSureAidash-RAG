"use client";

import { useState } from "react";
import React from "react";
import {
  FaHome,
  FaChartBar,
  FaTable,
  FaBars,
  FaMoneyBill,
} from "react-icons/fa";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { FaGears, FaMapLocation } from "react-icons/fa6";
import { IoChatbubblesOutline } from "react-icons/io5";

const Sidebar = () => {
  const [open, setOpen] = useState(false);

  // Split the menuItems list
  const topItems = [
    { name: "Dashboard", icon: <FaHome />, href: "/dashboard" },
    { name: "AI Chatbot", icon: <IoChatbubblesOutline />, href: "/chat" },
  ];

  const bottomItems = [
    { name: "Maps", icon: <FaMapLocation />, href: "/maps" },
    { name: "Settings", icon: <FaGears />, href: "/settings" },
  ];

  return (
    <div
      className={`bg-gray-800 text-white transition-all duration-300 h-screen fixed z-50 top-0 left-0 ${
        open ? "w-64" : "w-15"
      } flex flex-col`}
    >
      <div className="flex items-center px-4 py-3 border-b border-gray-700">
        <button onClick={() => setOpen(!open)} className="text-white">
          <FaBars />
        </button>
      </div>

      <nav className="flex-1 mt-4">
        {/* Top items */}
        {topItems.map((item, index) => (
          <Link
            href={item.href}
            key={index}
            className="flex items-center px-4 py-3 hover:bg-gray-700"
          >
            <div className="text-xl mr-3">{item.icon}</div>
            {open && <span className="text-sm">{item.name}</span>}
          </Link>
        ))}

        {/* SignedIn / SignedOut block after AI Chatbot */}
        <div className="ml-3 mt-3">
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>

        {/* Remaining items */}
        {bottomItems.map((item, index) => (
          <Link
            href={item.href}
            key={index}
            className="flex items-center px-4 py-3 hover:bg-gray-700"
          >
            <div className="text-xl mr-3">{item.icon}</div>
            {open && <span className="text-sm">{item.name}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
