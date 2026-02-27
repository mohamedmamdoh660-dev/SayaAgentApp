"use client";

import React from "react";
import { SectionCards } from "./section-cards";
import { GenderDistributionChart } from "./charts/gender-distribution-chart";
import { UniversityDistributionChart } from "./charts/university-distribution-chart";
import { ApplicationChart } from "./charts/application-chart";
import { RecentApplications } from "./recent-applications";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "./admin-dashboard";

const Dashboard = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.roles?.name === "admin";
  if (isAdmin) {
    return <AdminDashboard />;
  }
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-4 md:py-6">
        <SectionCards />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GenderDistributionChart />
          <UniversityDistributionChart />
        </div>
        <ApplicationChart />
        <RecentApplications />
      </div>
    </div>
  );
};

export default Dashboard;
