"use client";

import { useEffect, useState } from "react";
import { Pie, PieChart, Cell, Legend, Tooltip } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getGenderDistribution } from "@/modules/dashboard/services/dashboard-service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

// Custom legend component that shows both color and value
const CustomLegend = (props: any) => {
  const { payload } = props;

  return (
    <ul className="flex flex-wrap gap-4 justify-center mt-4">
      {payload.map((entry: any, index: number) => (
        <li
          key={`item-${index}`}
          className="flex items-center gap-2 text-[#9f9fa9]"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs">
            {entry.value}: {entry.payload.students}
          </span>
        </li>
      ))}
    </ul>
  );
};

export function GenderDistributionChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [colors, setColors] = useState<string[]>([]);

  const { userProfile } = useAuth();

  const fetchData = async () => {
    try {
      const data = await getGenderDistribution(
        userProfile?.id,
        userProfile?.agency_id,
        userProfile?.roles?.name
      );
      setChartData(data);

      // Generate colors for the chart
      const chartColors = data.map(
        (_, index) => `var(--chart-${(index % 5) + 1})`
      );
      setColors(chartColors);
    } catch (error) {
      console.error("Error fetching gender distribution:", error);
      toast.error("Failed to load gender distribution data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-neutral-900 border rounded-lg p-3 shadow-md">
          <p className="font-semibold">{item.gender}</p>
          <p className="text-sm">Students: {item.students}</p>
          <p className="text-sm text-muted-foreground">
            {item.percentage ? `${item.percentage}%` : ""}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle>Gender Distribution</CardTitle>
          <CardDescription>Students by gender</CardDescription>
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
      <CardContent className="flex-1 pb-0">
        {isLoading || isRefreshing ? (
          <div className="flex items-center justify-center h-[500px]">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="h-[500px] w-full">
            <PieChart
              width={500}
              height={300}
              className="mx-auto !w-full !h-[500px]"
            >
              <Tooltip content={<CustomTooltip />} />

              <Pie
                data={chartData}
                dataKey="students"
                nameKey="gender"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                // label={(entry) => `${entry.gender}: ${entry.students}`}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Legend
                content={<CustomLegend />}
                layout="horizontal"
                verticalAlign="bottom"
              />
            </PieChart>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
