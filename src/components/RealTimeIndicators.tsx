import React from 'react';
import { Wifi, Zap, Clock, Users } from 'lucide-react';

const RealTimeIndicators: React.FC = () => {
  const indicators = [
    {
      label: 'Network Status',
      value: 'Online',
      icon: <Wifi size={16} />,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Active Sessions',
      value: '12',
      icon: <Zap size={16} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Queue Wait Time',
      value: '3 min',
      icon: <Clock size={16} />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      label: 'Connected Users',
      value: '47',
      icon: <Users size={16} />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
        Real-time Status
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {indicators.map((indicator, index) => (
          <div key={index} className="flex items-center space-x-2 sm:space-x-3">
            <div className={`${indicator.bgColor} p-1.5 sm:p-2 rounded-lg flex-shrink-0`}>
              <div className={indicator.color}>{indicator.icon}</div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-600 truncate">{indicator.label}</p>
              <p className="font-semibold text-gray-900 text-sm sm:text-base">{indicator.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealTimeIndicators;