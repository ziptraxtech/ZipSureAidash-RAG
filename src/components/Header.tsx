"use client";

import React, { useState } from 'react';
import { Zap, Settings, Bell, Menu, X } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <a href="/dashboard" className="text-white/90 hover:text-white transition-colors duration-200 font-medium">Dashboard</a>
            <a href="#analytics" className="text-white/90 hover:text-white transition-colors duration-200 font-medium">Analytics</a>
            <a href="/report" className="text-white/90 hover:text-white transition-colors duration-200 font-medium">Reports</a>
            <a href="#settings" className="text-white/90 hover:text-white transition-colors duration-200 font-medium">Settings</a>
          </nav>

          {/* Desktop Status + Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <div className="text-center">
                <div className="text-xl font-bold text-white">8</div>
                <div className="text-xs text-blue-100">Stations</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-300">5</div>
                <div className="text-xs text-blue-100">Online</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-300">3</div>
                <div className="text-xs text-blue-100">Offline</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <Bell size={20} />
              </button>
              <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <Settings size={20} />
              </button>
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
            </div>
          </div>

          {/* Mobile right: UserButton + hamburger */}
          <div className="flex md:hidden items-center space-x-3">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
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
              <div className="text-base font-bold text-white">8</div>
              <div className="text-[10px] text-blue-100">Total</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/20">
              <div className="text-base font-bold text-green-300">5</div>
              <div className="text-[10px] text-blue-100">Online</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/20">
              <div className="text-base font-bold text-red-300">3</div>
              <div className="text-[10px] text-blue-100">Offline</div>
            </div>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-3 border-t border-white/20 pt-3 flex flex-col space-y-1">
            <a href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors font-medium">Dashboard</a>
            <a href="#analytics" onClick={() => setMobileMenuOpen(false)} className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors font-medium">Analytics</a>
            <a href="/report" onClick={() => setMobileMenuOpen(false)} className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors font-medium">Reports</a>
            <a href="#settings" onClick={() => setMobileMenuOpen(false)} className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors font-medium">Settings</a>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;