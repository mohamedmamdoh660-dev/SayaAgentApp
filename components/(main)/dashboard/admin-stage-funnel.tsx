"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
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
import { getApplicationFunnel } from "@/modules/dashboard/services/admin-dashboard-service";
import { COLORS } from "@/utils/colors";

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white dark:bg-neutral-900 border rounded-lg p-3 shadow-md">
        <p className="font-semibold">{item.name}</p>
        <p className="text-sm">Count: {item.value}</p>
        <p className="text-sm text-muted-foreground">
          {item.percentage ? `${item.percentage}%` : ""}
        </p>
      </div>
    );
  }
  return null;
};

export function AdminStageFunnel() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const funnelData = await getApplicationFunnel();

      // Sort largest to smallest
      const sortedData = [...funnelData].sort((a, b) => b.value - a.value);

      // Assign fixed colors
      const coloredData = sortedData.map((item, index) => ({
        ...item,
        fill: COLORS[index],
      }));

      setChartData(coloredData);
    } catch (error) {
      console.error("Error fetching funnel data:", error);
      toast.error("Failed to load application funnel data");
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

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle>Application Funnel</CardTitle>
          <CardDescription>
            Stage-wise progression of applications
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
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart
              //  margin={{ left: 30, bottom: 20, top: 20 }}
              >
                <Tooltip content={<CustomTooltip />} />
                <Funnel
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  isAnimationActive
                  offset={20}
                  width={400} // 👈 narrow width for better look
                >
                  <LabelList
                    position="right" // 👈 labels outside, on the right
                    fill="#9f9fa9"
                    stroke="none"
                    dataKey="name"
                    fontSize={11}
                    formatter={(val: string, entry: any) => {
                      return `${val} ${chartData.find((item) => item.name === val)?.value}`;
                    }}
                  />
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
