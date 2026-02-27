"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { format } from "date-fns";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getApplicationTimeline } from "@/modules/dashboard/services/dashboard-service";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/utils/colors";

// Dynamic chart config will be generated based on available stages
const generateChartConfig = (stages: string[]): ChartConfig => {
  const config: Record<string, { label: string; color: string }> = {};

  stages.forEach((stage, index) => {
    config[stage] = {
      label: stage.charAt(0).toUpperCase() + stage.slice(1),
      color: COLORS[index],
    };
  });

  return config;
};

// Ensure SVG ids are valid and consistent (no spaces or special characters)
const toSafeId = (value: string): string =>
  `fill-${value.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

export function ApplicationChart() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("7");
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [stages, setStages] = React.useState<string[]>([]);
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const { userProfile } = useAuth();

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("10");
    }
  }, [isMobile]);

  const loadData = React.useCallback(
    async (days: number) => {
      setIsLoading(true);
      try {
        const result = await getApplicationTimeline(
          days,
          userProfile?.id,
          userProfile?.agency_id,
          userProfile?.roles?.name
        );
        // Set chart data and stages
        setChartData(result.data);
        setStages(result.stages);

        // Generate chart config based on stages
        const config = generateChartConfig(result.stages);
        setChartConfig(config);
      } catch (error) {
        console.error("Error loading application timeline data:", error);
        toast.error("Failed to load application timeline");
      } finally {
        setIsLoading(false);
      }
    },
    [userProfile]
  );

  React.useEffect(() => {
    loadData(parseInt(timeRange));
  }, [timeRange, loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(parseInt(timeRange));
    setIsRefreshing(false);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-sm p-3">
          <p className="font-medium mb-2">
            {format(new Date(label), "MMM d, yyyy")}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div
                key={`tooltip-${index}`}
                className="flex items-center gap-2 text-sm"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium">{entry.name}:</span>
                <span>{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="@container/card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <CardTitle>Application Timeline</CardTitle>
            <CardDescription>
              <span className="hidden @[540px]/card:block">
                Data for the last {timeRange} days
              </span>
              <span className="@[540px]/card:hidden">
                Last {timeRange} days
              </span>
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
        </div>
        <CardAction className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="7">7 days</ToggleGroupItem>
            <ToggleGroupItem value="30">30 days</ToggleGroupItem>
            <ToggleGroupItem value="90">90 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Select days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7" className="rounded-lg">
                7 days
              </SelectItem>
              <SelectItem value="30" className="rounded-lg">
                30 days
              </SelectItem>
              <SelectItem value="90" className="rounded-lg">
                90 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="aspect-auto h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[400px] w-full"
              >
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    {stages.map((stage, index) => (
                      <linearGradient
                        key={toSafeId(stage)}
                        id={toSafeId(stage)}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={COLORS[index]}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={COLORS[index]}
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid vertical={false} opacity={0.1} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Legend />
                  {stages.map((stage, index) => (
                    <Area
                      key={`area-${stage}`}
                      type="monotone"
                      dataKey={stage}
                      name={stage.charAt(0).toUpperCase() + stage.slice(1)}
                      stroke={COLORS[index]}
                      strokeWidth={2}
                      fill={`url(#${toSafeId(stage)})`}
                      isAnimationActive={true}
                    />
                  ))}
                </AreaChart>
              </ChartContainer>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
