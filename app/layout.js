import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FaHome, FaChartBar, FaTable, FaBars } from "react-icons/fa";
import Sidebar from "@/components/Sidebar";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Zipsure AI",
  description: "Zipsure AI",
};

const menuItems = [
  { name: "Home", icon: <FaHome />, href: "#dashboard" },
  { name: "Analytics", icon: <FaChartBar />, href: "#analytics" },
  { name: "Reports", icon: <FaTable />, href: "#reports" },
];

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-200">
          <div>
            <Sidebar />
            <div className="ml-20">{children}</div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
