import React from 'react';
import { Activity, AlertTriangle, Battery, Zap, TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface StatCard {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down';
  gradient: string;
  iconBg: string;
  sparklineData?: { value: number }[];
}

const StatsCards: React.FC = () => {
  const stats: StatCard[] = [
    {
      title: 'Total EV Stations',
      value: '8',
      icon: <Zap size={24} />,
      trend: '+1 this month',
      trendDirection: 'up',
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/10',
      sparklineData: [
        { value: 6 }, { value: 7 }, { value: 6 }, { value: 8 }, { value: 7 }, { value: 8 }, { value: 8 }
      ]
    },
    {
      title: 'Online Stations',
      value: '5',
      icon: <Activity size={24} />,
      trend: 'Stable',
      trendDirection: 'up',
      gradient: 'from-green-500 to-green-600',
      iconBg: 'bg-green-500/10',
      sparklineData: [
        { value: 4 }, { value: 5 }, { value: 6 }, { value: 5 }, { value: 4 }, { value: 5 }, { value: 5 }
      ]
    },
    {
      title: 'Offline Stations',
      value: '3',
      icon: <AlertTriangle size={24} />,
      trend: 'Needs attention',
      trendDirection: 'down',
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-500/10',
      sparklineData: [
        { value: 2 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 3 }, { value: 3 }
      ]
    },
    {
      title: 'Avg Battery Health',
      value: '88%',
      icon: <Battery size={24} />,
      trend: '+3% this week',
      trendDirection: 'up',
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500/10',
      sparklineData: [
        { value: 82 }, { value: 85 }, { value: 87 }, { value: 86 }, { value: 88 }, { value: 89 }, { value: 88 }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-gray-100">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className={`${stat.iconBg} p-2 sm:p-3 rounded-xl`}>
              <div className={`bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.icon}
              </div>
            </div>
            {stat.trend && (
              <div className={`hidden sm:flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                stat.trendDirection === 'up'
                  ? 'text-green-700 bg-green-100'
                  : 'text-amber-700 bg-amber-100'
              }`}>
                <TrendingUp size={12} className="mr-1" />
                {stat.trend}
              </div>
            )}
          </div>
          
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
            <p className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-1 sm:mb-2`}>
              {stat.value}
            </p>
            
            {/* Mini sparkline chart */}
            {stat.sparklineData && (
              <div className="h-8 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stat.sparklineData}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={stat.trendDirection === 'up' ? '#10B981' : '#F59E0B'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;