import React from 'react';
import DeviceCards from './DeviceCards';

const Reports: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <DeviceCards />
      </div>
    </div>
  );
};

export default Reports;
