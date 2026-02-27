"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { getAdminDashboardStats } from "@/modules/dashboard/services/admin-dashboard-service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AdminStatsCards() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    paidStudents: 0,
    totalApplications: 0,
    todayStudents: 0,
    weekStudents: 0,
    todayApplications: 0,
    weekApplications: 0,
    successRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await getAdminDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching admin dashboard stats:", error);
      toast.error("Failed to load admin dashboard statistics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStats();
    setIsRefreshing(false);
  };

  return (
    <>
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
              ) : (
                stats.totalStudents.toLocaleString()
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUp className="mr-1 h-4 w-4" />
                Active
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Today Students</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
              ) : (
                stats.todayStudents.toLocaleString()
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUp className="mr-1 h-4 w-4" />
                Active
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>This Week Students</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
              ) : (
                stats.weekStudents.toLocaleString()
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUp className="mr-1 h-4 w-4" />
                Active
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Paid Students</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
              ) : (
                stats.paidStudents.toLocaleString()
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUp className="mr-1 h-4 w-4" />
                Active
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
      </div>

      {/* Daily and Weekly Stats */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {" "}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Applications</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
              ) : (
                stats.totalApplications.toLocaleString()
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUp className="mr-1 h-4 w-4" />
                Active
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Today Applications</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
              ) : (
                stats.todayApplications.toLocaleString()
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUp className="mr-1 h-4 w-4" />
                Active
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>This Week Applications</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
              ) : (
                stats.weekApplications.toLocaleString()
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUp className="mr-1 h-4 w-4" />
                Active
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
              ) : (
                `${Math.round(Number(stats.successRate))}%`
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUp className="mr-1 h-4 w-4" />
                Active
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
      </div>
    </>
  );
}
