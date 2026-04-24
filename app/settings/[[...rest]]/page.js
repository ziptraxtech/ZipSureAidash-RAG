"use client";

import { useUser } from "@clerk/nextjs";
import { UserProfile } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import { Settings, Coins, Mail, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    fetch("/api/user/credits")
      .then((r) => r.json())
      .then((d) => setCredits(d.credits))
      .catch(() => setCredits(0));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">

          {/* Page heading */}
          <div className="mb-8 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
              <Settings className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-500 text-sm mt-0.5">Manage your account and preferences</p>
            </div>
          </div>

          {/* User summary card */}
          {isLoaded && user && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Avatar + name */}
              <div className="flex items-center gap-4 flex-1">
                <img
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  className="w-16 h-16 rounded-full border-2 border-blue-100 object-cover flex-shrink-0"
                />
                <div>
                  <p className="text-lg font-bold text-gray-900">{user.fullName || "—"}</p>

                  {/* Email */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail size={13} className="text-gray-400" />
                    <p className="text-sm text-gray-500">{user.primaryEmailAddress?.emailAddress}</p>
                  </div>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-100">
                      <ShieldCheck size={11} />
                      {user.publicMetadata?.role || "Member"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Credits box */}
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-5 py-3.5 sm:flex-shrink-0">
                <Coins size={22} className="text-amber-500" />
                <div>
                  <p className="text-xs text-amber-500 font-medium leading-none mb-0.5">Available Credits</p>
                  <p className="text-3xl font-extrabold text-amber-700 leading-none">
                    {credits === null ? "—" : credits}
                  </p>
                  <a href="/payments" className="text-xs text-amber-600 hover:underline mt-0.5 block">
                    Buy more credits →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Clerk full profile manager */}
          <div className="flex justify-start">
            <UserProfile
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "rounded-2xl shadow-sm border border-gray-100 w-full",
                },
              }}
            />
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
