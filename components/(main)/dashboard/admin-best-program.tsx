"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBestPrograms } from "@/modules/dashboard/services/admin-dashboard-service";
import { COLORS } from "@/utils/colors";

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-neutral-900 border rounded-lg p-3 shadow-md">
        <p className="font-semibold">{payload[0].payload.name}</p>
        <p className="text-sm">Applications: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export function AdminBestProgram() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDegree, setSelectedDegree] = useState("All");
  const [selectedUniversity, setSelectedUniversity] = useState("All");
  const [selectedStage, setSelectedStage] = useState("All");

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Prepare filters
      const filters: any = {};
      if (selectedDegree !== "All") filters.degree = selectedDegree;
      if (selectedUniversity !== "All") filters.university = selectedUniversity;
      if (selectedStage !== "All")
        filters.stage = selectedStage.toLowerCase().replace(/ /g, "_");

      // Fetch data from API
      const data = await getBestPrograms(filters);

      // Add colors to the data
      const coloredData = data.map((item: any, index: number) => ({
        ...item,
        fill: COLORS[index],
        value: item.applications, // Ensure 'value' is set for the chart
      }));

      setChartData(coloredData);
    } catch (error) {
      console.error("Error fetching program data:", error);
      toast.error("Failed to load best programs data");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh data when filters change
  useEffect(() => {
    if (!isLoading) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDegree, selectedUniversity, selectedStage]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle>Popular Programs</CardTitle>
          <CardDescription>
            Top 20 programs by application count
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
        >
          <RefreshCw
            className={cn(
              "h-4 w-4",
              (isLoading || isRefreshing) && "animate-spin"
            )}
          />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 pb-0 pl-0 relative left-[-20px]">
        {isLoading || isRefreshing ? (
          <div className="flex items-center justify-center h-[450px]">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[600px] text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className={`h-[${chartData.length > 15 ? 600 : 450}px] w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={200}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    value.length > 40 ? value.substring(0, 38) + "..." : value
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="applications" barSize={20}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
