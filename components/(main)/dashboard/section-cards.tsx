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
import { TrendingUp, RefreshCw, Users, Calendar } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { getDashboardStats } from "@/modules/dashboard/services/dashboard-service";

import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export function SectionCards() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalApplications: 0,
    todayApplications: 0,
    thisWeekApplications: 0,
    todayStudents: 0,
    thisWeekStudents: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { userProfile } = useAuth();

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats(
        userProfile?.roles?.name,
        userProfile?.roles?.name === "agent"
          ? userProfile?.id
          : userProfile?.agency_id,
        userProfile?.id
      );
      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchStats();
    }
  }, [userProfile]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStats();
    setIsRefreshing(false);
  };

  const cardData = useMemo(
    () => [
      {
        title: "Total Students",
        value: stats.totalStudents,
        description: "Total registered students",
        subtext: "From all countries and programs",
        icon: <Users className="mr-1 h-4 w-4" />,
      },
      {
        title: "Total Applications",
        value: stats.totalApplications,
        description: "Total submitted applications",
        subtext: "Across all universities and programs",
        icon: <TrendingUp className="mr-1 h-4 w-4" />,
      },
      {
        title: "Today's Students",
        value: stats.todayStudents,
        description: "New students today",
        subtext: "Registered in the last 24 hours",
        icon: <TrendingUp className="mr-1 h-4 w-4" />,
      },
      {
        title: "Today's Applications",
        value: stats.todayApplications,
        description: "New applications today",
        subtext: "Submitted in the last 24 hours",
        icon: <TrendingUp className="mr-1 h-4 w-4" />,
      },
      {
        title: "This Week's Students",
        value: stats.thisWeekStudents,
        description: "New students this week",
        subtext: "Registered in the last 7 days",
        icon: <TrendingUp className="mr-1 h-4 w-4" />,
      },
      {
        title: "This Week's Applications",
        value: stats.thisWeekApplications,
        description: "New applications this week",
        subtext: "Submitted in the last 7 days",
        icon: <TrendingUp className="mr-1 h-4 w-4" />,
      },
    ],
    [stats]
  );

  return (
    <>
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-3 @5xl/main:grid-cols-3">
        {cardData.map((card, index) => (
          <Card key={index} className="@container/card">
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {isLoading ? (
                  <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
                ) : (
                  card?.value?.toLocaleString() || 0
                )}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  {card?.icon}
                  Active
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {card.description}
              </div>
              <div className="text-muted-foreground">{card.subtext}</div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
