"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUniversityDistribution } from "@/modules/dashboard/services/dashboard-service";
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
        <li key={`item-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm">
            {entry.value}: {entry.payload.applications}
          </span>
        </li>
      ))}
    </ul>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-2 border rounded shadow-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm">Applications: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export function AdminUniversityReport() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [colors, setColors] = useState<string[]>([]);
  const [selectedDegree, setSelectedDegree] = useState("All");
  const [degrees, setDegrees] = useState<string[]>(["All"]);

  const { userProfile } = useAuth();

  const fetchData = async () => {
    try {
      const data = await getUniversityDistribution(
        userProfile?.id,
        userProfile?.agency_id,
        userProfile?.roles?.name
      );

      // Limit to top universities for better visualization
      const sortedData = [...data].sort(
        (a, b) => b.applications - a.applications
      );
      const topData = sortedData.slice(0, 10);

      setChartData(topData);

      // Generate colors for the chart
      const chartColors = topData.map(
        (_, index) => `var(--chart-${(index % 5) + 1})`
      );
      setColors(chartColors);

      // Get available degrees (in a real implementation, this would come from an API call)
      setDegrees(["All", "Bachelor", "Master", "PhD"]);
    } catch (error) {
      console.error("Error fetching university distribution:", error);
      toast.error("Failed to load university distribution data");
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

  const CustomLabel = (props: any) => {
    const { x, y, value, index } = props;

    const item = chartData[index];

    return (
      <text x={x} y={y} fill="#ffffff">
        {item.university} {item.applications}
      </text>
    );
  };

  const handleDegreeChange = (degree: string) => {
    setSelectedDegree(degree);
    // In a real implementation, you would filter data based on degree
    // For now, we'll just simulate this by using the same data
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Admin University Report</CardTitle>
          <CardDescription>Applications by university</CardDescription>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  dataKey="applications"
                  nameKey="university"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={<CustomLabel />}
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
                  fill="#9f9fa9"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
