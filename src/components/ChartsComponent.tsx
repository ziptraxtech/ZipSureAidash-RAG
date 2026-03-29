import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, Battery, Zap, Activity } from 'lucide-react';

const ChartsComponent: React.FC = () => {
  // Device status distribution data
  const statusData = [
    { name: 'Excellent', value: 2, color: '#10B981' },
    { name: 'Good', value: 3, color: '#3B82F6' },
    { name: 'Critical', value: 2, color: '#EF4444' },
    { name: 'Offline', value: 1, color: '#6B7280' }
  ];

  // Device health data
  const healthData = [
    { name: 'Device 1', health: 45, status: 'Critical' },
    { name: 'Device 2', health: 92, status: 'Excellent' },
    { name: 'Device 3', health: 78, status: 'Good' },
    { name: 'Device 4', health: 34, status: 'Critical' },
    { name: 'Device 5', health: 0, status: 'Offline' },
    { name: 'Device 6', health: 81, status: 'Good' },
    { name: 'Device 7', health: 96, status: 'Excellent' },
    { name: 'Device 8', health: 87, status: 'Good' }
  ];

  // Usage trend data (mock data for demonstration)
  const usageData = [
    { time: '6AM', usage: 12, efficiency: 85 },
    { time: '9AM', usage: 45, efficiency: 92 },
    { time: '12PM', usage: 78, efficiency: 88 },
    { time: '3PM', usage: 89, efficiency: 94 },
    { time: '6PM', usage: 95, efficiency: 91 },
    { time: '9PM', usage: 67, efficiency: 89 },
    { time: '12AM', usage: 23, efficiency: 87 }
  ];

  // Energy consumption data (mock data)
  const energyData = [
    { month: 'Jan', energy: 2400 },
    { month: 'Feb', energy: 1398 },
    { month: 'Mar', energy: 9800 },
    { month: 'Apr', energy: 3908 },
    { month: 'May', energy: 4800 },
    { month: 'Jun', energy: 3800 }
  ];

  const getHealthColor = (health: number) => {
    if (health >= 80) return '#10B981';
    if (health >= 60) return '#3B82F6';
    if (health >= 40) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
      {/* Device Status Distribution */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className="bg-green-600 p-2 rounded-lg mr-3 flex-shrink-0">
            <Activity className="text-white" size={18} />
          </div>
          <h3 className="text-base sm:text-xl font-bold text-gray-900">Device Status Distribution</h3>
        </div>
        <div className="h-52 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Device Health Status */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className="bg-blue-600 p-2 rounded-lg mr-3 flex-shrink-0">
            <Battery className="text-white" size={18} />
          </div>
          <h3 className="text-base sm:text-xl font-bold text-gray-900">Device Health Status</h3>
        </div>
        <div className="h-52 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={healthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name) => [`${value}%`, 'Health']}
                labelFormatter={(label) => `Station: ${label}`}
              />
              <Bar 
                dataKey="health" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              >
                {healthData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getHealthColor(entry.health)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Usage Trends */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className="bg-purple-600 p-2 rounded-lg mr-3 flex-shrink-0">
            <TrendingUp className="text-white" size={18} />
          </div>
          <h3 className="text-base sm:text-xl font-bold text-gray-900">Daily Usage & Efficiency</h3>
        </div>
        <div className="h-52 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="usage" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                name="Usage %"
              />
              <Line 
                type="monotone" 
                dataKey="efficiency" 
                stroke="#10B981" 
                strokeWidth={3}
                name="Efficiency %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Energy Consumption */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className="bg-yellow-600 p-2 rounded-lg mr-3 flex-shrink-0">
            <Zap className="text-white" size={18} />
          </div>
          <h3 className="text-base sm:text-xl font-bold text-gray-900">Monthly Energy Consumption</h3>
        </div>
        <div className="h-52 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} kWh`, 'Energy Consumed']} />
              <Area 
                type="monotone" 
                dataKey="energy" 
                stroke="#F59E0B" 
                fill="url(#energyGradient)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartsComponent;