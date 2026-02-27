import React from "react";
import { AdminStatsCards } from "./admin-stats-cards";
import { AdminUniversityReport } from "./admin-university-report";
import { AdminStageFunnel } from "./admin-stage-funnel";
import { AdminBestProgram } from "./admin-best-program";
import { UniversityDistributionChart } from "./charts/university-distribution-chart";
import { ApplicationChart } from "./charts/application-chart";
import { RecentApplications } from "./recent-applications";

const AdminDashboard = () => {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-4 md:py-6">
        <AdminStatsCards />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UniversityDistributionChart />
          <AdminStageFunnel />
        </div>
        <AdminBestProgram />
        <ApplicationChart />
        <RecentApplications />
      </div>
    </div>
  );
};

export default AdminDashboard;
