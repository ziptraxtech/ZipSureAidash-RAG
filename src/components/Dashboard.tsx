import React from 'react';
import { Zap } from 'lucide-react';
import StatsCards from './StatsCards';
import RealTimeIndicators from './RealTimeIndicators';
import ChartsComponent from './ChartsComponent';
import MapComponent from './MapComponent';


const Dashboard: React.FC = () => {
  return (
    <div className="bg-gray-50 text-slate-800 min-h-screen">
      {/* <Header /> */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Overview
            </h1>
            <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
          <p className="text-gray-600">Monitor and manage your EV charging stations in real-time</p>
        </div>
        
        <StatsCards />
        
        <RealTimeIndicators />
        
        <ChartsComponent />
        
        <MapComponent />
        
      </main>
    </div>
  );
};

export default Dashboard;