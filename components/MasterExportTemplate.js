// components/MasterExportTemplate.js
import DashboardPage from "@/app/dashboard/page";
import AnalyticsPage from "@/app/analytics/page";
import ReportsPage from "@/app/reports/page";

export default function MasterExportTemplate() {
  return (
    <div id="master-export-area" style={{ position: 'absolute', left: '-9999px', top: 0, width: '1200px' }}>
      <div id="page-1"><DashboardPage /></div>
      <div id="page-2"><AnalyticsPage /></div>
      <div id="page-3"><ReportsPage /></div>
    </div>
  );
}