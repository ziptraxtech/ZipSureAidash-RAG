import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { 
  ArrowLeft, 
  Battery, 
  Thermometer, 
  Zap, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Shield,
  Settings,
  Download,
  Share2,
  Calendar
} from 'lucide-react';

const deviceReports: Record<string, any> = {
  '1': {
    name: 'Device 1',
    location: 'CDR Chowk, Near Chattarpur Metro',
    summary: [
      { param: 'Voltage', value: '350 V – 415 V' },
      { param: 'Current', value: '-95 A – +110 A' },
      { param: 'Temperature', value: '26 °C – 42 °C' },
      { param: 'State of Charge (SOC)', value: '20 % – 95 %' },
      { param: 'State of Health (SOH)', value: '45 %' },
      { param: 'Internal Resistance', value: '0.8 mΩ' },
      { param: 'Cell Imbalance', value: '3.2 %' },
    ],
    gaugeValue: 45,
    voltage: { min: 350, max: 415 },
    current: { min: -95, max: 110 },
    soc: { min: 20, max: 95 },
    observations: [
      "The 30-minute test conducted on 28 September 2025 shows critical battery degradation concerns. Voltage levels fluctuated significantly between 350 V and 415 V, indicating instability. Current flow showed irregular patterns from -95 A to +110 A with concerning spikes. Temperature reached elevated levels up to 42°C, suggesting thermal management stress.",
      "The State of Charge (SOC) exhibited slow and inefficient charging patterns, struggling to maintain consistent levels. The State of Health (SOH) measured at a critical 45%, indicating severe degradation. Internal resistance has increased substantially to 0.8 mΩ, and cell imbalance at 3.2% suggests significant uneven charge distribution."
    ],
    verdict: "Based on the analyzed data, the battery shows severe degradation and requires immediate replacement. This device is operating at critical performance levels and poses reliability and safety risks. Immediate action is strongly recommended within the next 2-4 weeks. The high internal resistance and significant cell imbalance indicate the battery is approaching end-of-life conditions.",
    gaugeColor: "#EF4444"
  },
  '2': {
    name: 'Device 2',
    location: 'Hauz Khas Metro Station, 1km ahead',
    summary: [
      { param: 'Voltage', value: '360 V – 420 V' },
      { param: 'Current', value: '-100 A – +115 A' },
      { param: 'Temperature', value: '24 °C – 38 °C' },
      { param: 'State of Charge (SOC)', value: '25 % – 97 %' },
      { param: 'State of Health (SOH)', value: '92 %' },
      { param: 'Internal Resistance', value: '0.35 mΩ' },
      { param: 'Cell Imbalance', value: '< 1.2 %' },
    ],
    gaugeValue: 92,
    voltage: { min: 360, max: 420 },
    current: { min: -100, max: 115 },
    soc: { min: 25, max: 97 },
    observations: [
      "The 30-minute test conducted on 1 October 2025 at Hauz Khas Metro demonstrates exceptional battery performance. Voltage levels remained highly stable between 360 V and 420 V, showing excellent regulation. Current flow was consistent within the range of -100 A to +115 A, with smooth transitions. Temperature remained well-controlled between 24°C and 38°C.",
      "The State of Charge (SOC) exhibited rapid and efficient charging, reaching 97% during the test period. The State of Health (SOH) measured at an impressive 92%, indicating minimal degradation. Internal resistance remained low at 0.35 mΩ, and cell imbalance was excellent at < 1.2%."
    ],
    verdict: "Based on the analyzed data, the battery is in excellent condition. This device represents optimal performance with minimal degradation. No immediate service is required, and the system should continue to operate at peak efficiency. Regular monitoring every 6 months is sufficient for this high-performing unit.",
    gaugeColor: "#10B981"
  },
  '3': {
    name: 'Device 3',
    location: 'Qutub Minar',
    summary: [
      { param: 'Voltage', value: '355 V – 410 V' },
      { param: 'Current', value: '-90 A – +105 A' },
      { param: 'Temperature', value: '27 °C – 40 °C' },
      { param: 'State of Charge (SOC)', value: '22 % – 90 %' },
      { param: 'State of Health (SOH)', value: '78 %' },
      { param: 'Internal Resistance', value: '0.5 mΩ' },
      { param: 'Cell Imbalance', value: '2.1 %' },
    ],
    gaugeValue: 78,
    voltage: { min: 355, max: 410 },
    current: { min: -90, max: 105 },
    soc: { min: 22, max: 90 },
    observations: [
      "The 30-minute test conducted on 29 September 2025 at Qutub Minar shows good battery performance with some aging signs. Voltage levels remained stable between 355 V and 410 V with minor fluctuations. Current flow operated within the range of -90 A to +105 A, indicating healthy capacity. Temperature was managed well between 27°C and 40°C.",
      "The State of Charge (SOC) showed good charging characteristics, reaching 90% during the test period. The State of Health (SOH) measured at 78%, which indicates good condition with moderate degradation. Internal resistance is acceptable at 0.5 mΩ, and cell imbalance at 2.1% is within reasonable limits."
    ],
    verdict: "Based on the analyzed data, the battery is in good operational condition. Some signs of aging are present but within acceptable parameters. This device should continue reliable operation with closer monitoring. Regular inspection every 4 months is recommended to track performance changes.",
    gaugeColor: "#10B981"
  },
  '4': {
    name: 'Device 4',
    location: 'TB Hospital near Qutub Minar',
    summary: [
      { param: 'Voltage', value: '320 V – 380 V' },
      { param: 'Current', value: '-75 A – +85 A' },
      { param: 'Temperature', value: '30 °C – 48 °C' },
      { param: 'State of Charge (SOC)', value: '12 % – 82 %' },
      { param: 'State of Health (SOH)', value: '34 %' },
      { param: 'Internal Resistance', value: '0.9 mΩ' },
      { param: 'Cell Imbalance', value: '4.1 %' },
    ],
    gaugeValue: 34,
    voltage: { min: 320, max: 380 },
    current: { min: -75, max: 85 },
    soc: { min: 12, max: 82 },
    observations: [
      "The 30-minute test conducted on 30 September 2025 at TB Hospital reveals critical battery degradation concerns. Voltage levels showed considerable instability, ranging from 320 V to 380 V with frequent fluctuations. Current flow was limited to -75 A to +85 A, indicating reduced capacity. Temperature reached concerning levels up to 48°C.",
      "The State of Charge (SOC) showed slow and inefficient charging, reaching only 82% during the test period. The State of Health (SOH) measured at a critical 34%, indicating severe degradation. Internal resistance has increased substantially to 0.9 mΩ, and cell imbalance at 4.1% suggests serious uneven charge distribution."
    ],
    verdict: "Based on the analyzed data, the battery shows critical degradation and requires immediate replacement. This device is operating below safe performance levels and poses significant reliability risks. Immediate replacement is strongly recommended within the next 1-2 weeks. The battery has reached end-of-life conditions.",
    gaugeColor: "#EF4444"
  },
  '5': {
    name: 'Device 5',
    location: 'Hauz Khas Metro Gate 1',
    summary: [
      { param: 'Voltage', value: '0 V – 0 V' },
      { param: 'Current', value: '0 A – 0 A' },
      { param: 'Temperature', value: 'N/A' },
      { param: 'State of Charge (SOC)', value: '0 %' },
      { param: 'State of Health (SOH)', value: '0 %' },
      { param: 'Internal Resistance', value: 'N/A' },
      { param: 'Cell Imbalance', value: 'N/A' },
    ],
    gaugeValue: 0,
    voltage: { min: 0, max: 0 },
    current: { min: 0, max: 0 },
    soc: { min: 0, max: 0 },
    observations: [
      "Device 5 is currently offline and no test data could be collected. The system appears to be completely non-responsive with no electrical activity detected. This indicates a complete system failure or power disconnection.",
      "All monitoring parameters show zero readings, suggesting either a complete battery failure, system shutdown, or connectivity issue. No thermal, electrical, or charge data is available for analysis."
    ],
    verdict: "Device is completely offline and requires immediate technical investigation. The system needs comprehensive diagnostic testing to determine if this is a battery failure, electrical system issue, or connectivity problem. Immediate on-site technical support is required.",
    gaugeColor: "#6B7280"
  },
  '6': {
    name: 'Device 6',
    location: 'RK Puram Sector 5',
    summary: [
      { param: 'Voltage', value: '355 V – 410 V' },
      { param: 'Current', value: '-90 A – +105 A' },
      { param: 'Temperature', value: '25 °C – 40 °C' },
      { param: 'State of Charge (SOC)', value: '22 % – 93 %' },
      { param: 'State of Health (SOH)', value: '81 %' },
      { param: 'Internal Resistance', value: '0.45 mΩ' },
      { param: 'Cell Imbalance', value: '< 1.5 %' },
    ],
    gaugeValue: 81,
    voltage: { min: 355, max: 410 },
    current: { min: -90, max: 105 },
    soc: { min: 22, max: 93 },
    observations: [
      "The 30-minute test conducted on 2 October 2025 at RK Puram Sector 5 shows solid battery performance. Voltage levels remained stable between 355 V and 410 V with minimal fluctuations. Current flow operated smoothly within the range of -90 A to +105 A, indicating healthy capacity. Temperature was well-managed between 25°C and 40°C.",
      "The State of Charge (SOC) showed efficient charging characteristics, reaching 93% during the test period. The State of Health (SOH) measured at 81%, which indicates good condition with minor degradation. Internal resistance is reasonable at 0.45 mΩ, and cell imbalance below 1.5% ensures adequate charge distribution."
    ],
    verdict: "Based on the analyzed data, the battery is in good operational condition. Minor signs of aging are present but within acceptable parameters. This device should continue reliable operation for the foreseeable future. Regular monitoring every 4-6 months is recommended to track gradual performance changes.",
    gaugeColor: "#10B981"
  },
  '7': {
    name: 'Device 7',
    location: 'IIT Delhi',
    summary: [
      { param: 'Voltage', value: '365 V – 425 V' },
      { param: 'Current', value: '-105 A – +120 A' },
      { param: 'Temperature', value: '23 °C – 36 °C' },
      { param: 'State of Charge (SOC)', value: '28 % – 98 %' },
      { param: 'State of Health (SOH)', value: '96 %' },
      { param: 'Internal Resistance', value: '0.32 mΩ' },
      { param: 'Cell Imbalance', value: '< 1.0 %' },
    ],
    gaugeValue: 96,
    voltage: { min: 365, max: 425 },
    current: { min: -105, max: 120 },
    soc: { min: 28, max: 98 },
    observations: [
      "The 30-minute test conducted on 3 October 2025 at IIT Delhi campus demonstrates outstanding battery performance. Voltage levels showed exceptional stability between 365 V and 425 V with precise regulation. Current flow was robust and consistent within the range of -105 A to +120 A, indicating optimal capacity utilization. Temperature remained excellently controlled between 23°C and 36°C.",
      "The State of Charge (SOC) exhibited rapid and highly efficient charging, reaching an impressive 98% during the test period. The State of Health (SOH) measured at an exceptional 96%, indicating virtually no degradation. Internal resistance is excellent at 0.32 mΩ, and cell imbalance below 1.0% ensures perfect charge distribution."
    ],
    verdict: "Based on the analyzed data, the battery is in excellent condition with near-perfect performance metrics. This device represents peak operational efficiency with minimal wear. No service is required, and the system will continue to operate at maximum effectiveness. Standard monitoring every 6-8 months is sufficient.",
    gaugeColor: "#10B981"
  },
  '8': {
    name: 'Device 8',
    location: 'Panchsheel Park Metro Station',
    summary: [
      { param: 'Voltage', value: '358 V – 415 V' },
      { param: 'Current', value: '-92 A – +108 A' },
      { param: 'Temperature', value: '26 °C – 39 °C' },
      { param: 'State of Charge (SOC)', value: '24 % – 94 %' },
      { param: 'State of Health (SOH)', value: '87 %' },
      { param: 'Internal Resistance', value: '0.42 mΩ' },
      { param: 'Cell Imbalance', value: '< 1.4 %' },
    ],
    gaugeValue: 87,
    voltage: { min: 358, max: 415 },
    current: { min: -92, max: 108 },
    soc: { min: 24, max: 94 },
    observations: [
      "The 30-minute test conducted on 4 October 2025 at Panchsheel Park Metro Station demonstrates excellent battery performance. Voltage levels remained highly stable between 358 V and 415 V with consistent regulation. Current flow was smooth and reliable within the range of -92 A to +108 A, indicating strong capacity. Temperature was well-controlled between 26°C and 39°C.",
      "The State of Charge (SOC) showed efficient and rapid charging, reaching 94% during the test period. The State of Health (SOH) measured at a strong 87%, indicating excellent condition with minimal degradation. Internal resistance remains good at 0.42 mΩ, and cell imbalance below 1.4% ensures uniform charge distribution."
    ],
    verdict: "Based on the analyzed data, the battery is in excellent operational condition. This device shows strong performance metrics with minimal aging effects. The system should continue reliable operation with high efficiency. Regular monitoring every 5-6 months is recommended to maintain optimal performance tracking.",
    gaugeColor: "#10B981"
  }
};

const BatteryReport: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const report = deviceReports[deviceId || ''];

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h1>
          <p className="text-gray-600 mb-4">The requested device report could not be found.</p>
          <Link to="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <ArrowLeft className="mr-2" size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Create chart data from report parameters
  const performanceData = [
    { name: 'SOH', value: report.gaugeValue, color: '#10B981' },
    { name: 'Efficiency', value: Math.max(60, report.gaugeValue - 5), color: '#3B82F6' },
    { name: 'Reliability', value: Math.max(70, report.gaugeValue + 5), color: '#8B5CF6' },
    { name: 'Safety', value: Math.max(80, report.gaugeValue + 10), color: '#F59E0B' }
  ];

  const trendData = [
    { month: 'Jan', soh: Math.min(98, report.gaugeValue + 10), efficiency: 94, temperature: 28 },
    { month: 'Feb', soh: Math.min(96, report.gaugeValue + 8), efficiency: 92, temperature: 30 },
    { month: 'Mar', soh: Math.min(94, report.gaugeValue + 6), efficiency: 90, temperature: 32 },
    { month: 'Apr', soh: Math.min(92, report.gaugeValue + 4), efficiency: 88, temperature: 35 },
    { month: 'May', soh: Math.min(90, report.gaugeValue + 2), efficiency: 85, temperature: 38 },
    { month: 'Jun', soh: report.gaugeValue, efficiency: 83, temperature: 36 }
  ];

  const getStatusColor = (value: number) => {
    if (value >= 85) return 'text-green-600 bg-green-100';
    if (value >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (value: number) => {
    if (value >= 85) return <CheckCircle className="text-green-600" size={20} />;
    if (value >= 70) return <AlertTriangle className="text-yellow-600" size={20} />;
    return <AlertTriangle className="text-red-600" size={20} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="mr-2" size={20} />
                Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Battery Performance Report</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100">
                <Download className="mr-2" size={16} />
                Export PDF
              </button>
              <button className="flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100">
                <Share2 className="mr-2" size={16} />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Device Overview Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Battery className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{report.name}</h2>
                <p className="text-gray-600 text-lg">{report.location}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Calendar className="mr-1" size={14} />
                  Report Generated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(report.gaugeValue)}`}>
                {getStatusIcon(report.gaugeValue)}
                <span className="ml-2">
                  {report.gaugeValue >= 85 ? 'Excellent' : report.gaugeValue >= 70 ? 'Good' : 'Needs Attention'}
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">{report.gaugeValue}%</p>
              <p className="text-gray-600">Overall Health</p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Zap className="text-blue-600" size={20} />
                <span className="text-xs font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded-full">Voltage</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{report.voltage.min}-{report.voltage.max}V</p>
              <p className="text-sm text-blue-700">Operating Range</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <Activity className="text-green-600" size={20} />
                <span className="text-xs font-medium text-green-600 bg-green-200 px-2 py-1 rounded-full">Current</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{report.current.min} to {report.current.max}A</p>
              <p className="text-sm text-green-700">Flow Range</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Battery className="text-purple-600" size={20} />
                <span className="text-xs font-medium text-purple-600 bg-purple-200 px-2 py-1 rounded-full">SOC</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{report.soc.min}-{report.soc.max}%</p>
              <p className="text-sm text-purple-700">Charge Range</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <Thermometer className="text-orange-600" size={20} />
                <span className="text-xs font-medium text-orange-600 bg-orange-200 px-2 py-1 rounded-full">Temp</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">{report.summary.find((s: any) => s.param === 'Temperature')?.value}</p>
              <p className="text-sm text-orange-700">Operating Range</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Metrics */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="mr-2 text-blue-600" size={20} />
              Performance Metrics
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Activity className="mr-2 text-green-600" size={20} />
              6-Month Trend Analysis
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="soh" stroke="#10B981" strokeWidth={3} name="SOH %" />
                  <Line type="monotone" dataKey="efficiency" stroke="#3B82F6" strokeWidth={3} name="Efficiency %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Parameters */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Settings className="mr-2 text-gray-600" size={20} />
            Detailed Technical Parameters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.summary.map((param: any, index: number) => (
              <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                <h4 className="font-semibold text-gray-900 mb-1">{param.param}</h4>
                <p className="text-lg font-bold text-blue-600">{param.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Observations and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="mr-2 text-blue-600" size={20} />
              Technical Analysis
            </h3>
            <div className="space-y-4">
              {report.observations.map((obs: string, index: number) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-gray-700 leading-relaxed">{obs}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="mr-2 text-green-600" size={20} />
              Professional Verdict
            </h3>
            <div className={`p-6 rounded-xl border-l-4 ${
              report.gaugeValue >= 85 ? 'bg-green-50 border-green-500' :
              report.gaugeValue >= 70 ? 'bg-yellow-50 border-yellow-500' :
              'bg-red-50 border-red-500'
            }`}>
              <div className="flex items-start space-x-3">
                {getStatusIcon(report.gaugeValue)}
                <div>
                  <h4 className={`font-semibold mb-2 ${
                    report.gaugeValue >= 85 ? 'text-green-800' :
                    report.gaugeValue >= 70 ? 'text-yellow-800' :
                    'text-red-800'
                  }`}>
                    {report.gaugeValue >= 85 ? 'Optimal Performance' :
                     report.gaugeValue >= 70 ? 'Monitoring Required' :
                     'Immediate Action Needed'}
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{report.verdict}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Clock className="mr-2 text-purple-600" size={20} />
            Recommended Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Immediate (0-30 days)</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Continue regular monitoring</li>
                <li>• Check thermal management</li>
                <li>• Verify charge cycles</li>
              </ul>
            </div>
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Short Term (1-3 months)</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Schedule detailed inspection</li>
                <li>• Consider cell balancing</li>
                <li>• Review usage patterns</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Long Term (3-6 months)</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Plan preventive maintenance</li>
                <li>• Assess replacement timeline</li>
                <li>• Update monitoring protocols</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatteryReport;