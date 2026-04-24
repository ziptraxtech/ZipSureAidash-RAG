"use client";

import React, { useState, useEffect } from 'react';
import { Zap, Settings, Bell, Menu, X } from 'lucide-react';
import { UserButton, SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Must match initialDevices in DeviceCards.tsx
const INITIAL_STATUSES: Record<number, 'excellent' | 'good' | 'warning' | 'critical' | 'offline'> = {
  1: 'good', 2: 'good', 3: 'excellent', 4: 'excellent', 5: 'good',
  6: 'good', 7: 'excellent', 8: 'excellent', 9: 'excellent',
};

const STATS_LS_KEY = 'headerStats';

function getApiUrl(id: number): string {
  if (id === 1) return '/api/charger_data_1?lastOnly=true';
  if (id === 9) return '/api/sapna_charger';
  return `/api/charger_data?device=device${id}&lastOnly=true`;
}

function loadStats(): { total: number; online: number; offline: number } | null {
  try { return JSON.parse(localStorage.getItem(STATS_LS_KEY) || 'null'); } catch { return null; }
}

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ total: 9, online: 0, offline: 0 });

  useEffect(() => {
    // Show cached counts immediately
    const cached = loadStats();
    if (cached) setStats(cached);

    let cancelled = false;

    const fetchStats = async () => {
      const deviceIds = Object.keys(INITIAL_STATUSES).map(Number);

      const results = await Promise.allSettled(
        deviceIds.map(id =>
          fetch(getApiUrl(id), { signal: AbortSignal.timeout(8000) })
            .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
            .then(data => {
              const points: { datetime: string }[] = data.points || [];
              const valid = points.filter(p => p.datetime && !p.datetime.startsWith('1970'));
              if (valid.length === 0) return null;
              return new Date(valid[valid.length - 1].datetime);
            })
        )
      );

      if (cancelled) return;

      let online = 0;
      let offline = 0;
      const now = Date.now();

      deviceIds.forEach((_id, i) => {
        const r = results[i];
        if (r.status === 'fulfilled' && r.value !== null && (now - r.value.getTime()) > THIRTY_DAYS_MS) {
          offline++;
        } else {
          online++;
        }
      });

      const fresh = { total: deviceIds.length, online, offline };
      setStats(fresh);
      try { localStorage.setItem(STATS_LS_KEY, JSON.stringify(fresh)); } catch { /* ignore */ }
    };

    fetchStats();
    return () => { cancelled = true; };
  }, []);

  return (
    <header className="zipsure-gradient shadow-xl border-b border-blue-600/20">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/20">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">ZipSureAI</h1>
              <p className="text-blue-100 font-medium text-xs sm:text-sm hidden sm:block">Battery Monitoring Dashboard</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8">
            <a href="/overview" className="text-white/90 hover:text-white transition-colors duration-200 font-medium">Overview</a>
            <a href="/stations" className="text-white/90 hover:text-white transition-colors duration-200 font-medium">Stations</a>
            <a href="/payments" className="text-white/90 hover:text-white transition-colors duration-200 font-medium">Payments</a>
            <a href="/settings" className="text-white/90 hover:text-white transition-colors duration-200 font-medium">Settings</a>
          </nav>

          {/* Desktop Status + Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-blue-100">Stations</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-300">{stats.online}</div>
                <div className="text-xs text-blue-100">Online</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-300">{stats.offline}</div>
                <div className="text-xs text-blue-100">Offline</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <SignedIn>
                <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                  <Bell size={20} />
                </button>
                <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                  <Settings size={20} />
                </button>
                <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="redirect">
                  <button className="px-5 py-2 rounded-full border border-white/60 bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-all duration-200">
                    Login
                  </button>
                </SignInButton>
                <SignUpButton mode="redirect">
                  <button className="px-5 py-2 rounded-full bg-teal-500 hover:bg-teal-400 text-white font-medium text-sm transition-all duration-200 shadow-lg">
                    Signup
                  </button>
                </SignUpButton>
              </SignedOut>
            </div>
          </div>

          {/* Mobile right: auth + hamburger */}
          <div className="flex md:hidden items-center space-x-2">
            <SignedIn>
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="redirect">
                <button className="px-3 py-1.5 rounded-full border border-white/60 bg-white/10 text-white font-medium text-xs hover:bg-white/20 transition-all">
                  Login
                </button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <button className="px-3 py-1.5 rounded-full bg-teal-500 hover:bg-teal-400 text-white font-medium text-xs transition-all shadow">
                  Signup
                </button>
              </SignUpButton>
            </SignedOut>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-all"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile stats bar */}
        <div className="md:hidden mt-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/20">
              <div className="text-base font-bold text-white">{stats.total}</div>
              <div className="text-[10px] text-blue-100">Total</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/20">
              <div className="text-base font-bold text-green-300">{stats.online}</div>
              <div className="text-[10px] text-blue-100">Online</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/20">
              <div className="text-base font-bold text-red-300">{stats.offline}</div>
              <div className="text-[10px] text-blue-100">Offline</div>
            </div>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-3 border-t border-white/20 pt-3 flex flex-col space-y-1">
            <a href="/overview" onClick={() => setMobileMenuOpen(false)} className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors font-medium">Overview</a>
            <a href="/stations" onClick={() => setMobileMenuOpen(false)} className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors font-medium">Stations</a>
            <a href="/payments" onClick={() => setMobileMenuOpen(false)} className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors font-medium">Payments</a>
            <a href="/settings" onClick={() => setMobileMenuOpen(false)} className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors font-medium">Settings</a>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;