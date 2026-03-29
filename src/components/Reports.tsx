import React from 'react';
import { Zap } from 'lucide-react';
import DeviceCards from './DeviceCards';

const Reports: React.FC = () => {
  return (
    <div className="bg-gray-50 text-slate-800 min-h-screen">
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-blue-600 p-2 rounded-lg mr-3 shadow-lg">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Station Reports
              </h2>
              <p className="text-gray-600">Detailed monitoring for all EV charging points</p>
            </div>
          </div>
        </div>
        <DeviceCards />
      </main>
    </div>
  );
};

export default Reports;