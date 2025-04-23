import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { BACKEND_URL } from "@/consts/config";
import { toast } from "sonner";
import axios from "axios";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import Layout from "@/components/Layout";
import { format, parseISO } from "date-fns";
import { useSearchParams } from "react-router-dom";

const SENSOR_OPTIONS = [
  { value: "temperature", label: "Temperature" },
  { value: "humidity", label: "Humidity" },
  { value: "soil_moisture", label: "Soil Moisture" },
  { value: "lux", label: "Light" },
  { value: "nitrogen", label: "Nitrogen" },
  { value: "phosphorus", label: "Phosphorus" },
  { value: "potassium", label: "Potassium" },
];

const FILL_METHODS = [
  { value: "ffill", label: "Forward Fill" },
  { value: "bfill", label: "Backward Fill" },
  { value: "linear", label: "Linear Interpolation" },
  { value: "time", label: "Time-based" },
];

const MODULE_COLORS = [
  "#ef4444", // red-500
  "#3b82f6", // blue-500
  "#22c55e", // green-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#06b6d4", // cyan-500
  "#a855f7", // purple-500
];

export default function QueryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [moduleIds, setModuleIds] = useState<string>(
    searchParams.get("modules") || "",
  );
  const [selectedSensor, setSelectedSensor] = useState<string>(
    searchParams.get("sensor") || "",
  );
  const [startTime, setStartTime] = useState<string>(
    searchParams.get("start") || "",
  );
  const [endTime, setEndTime] = useState<string>(searchParams.get("end") || "");
  const [fillMethod, setFillMethod] = useState<string>(
    searchParams.get("fill") || "ffill",
  );
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Update URL params when configuration changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (moduleIds) params.set("modules", moduleIds);
    if (selectedSensor) params.set("sensor", selectedSensor);
    if (startTime) params.set("start", startTime);
    if (endTime) params.set("end", endTime);
    if (fillMethod) params.set("fill", fillMethod);

    // Only update URL if we have at least one parameter
    if (params.toString()) {
      setSearchParams(params);
    }
  }, [
    moduleIds,
    selectedSensor,
    startTime,
    endTime,
    fillMethod,
    setSearchParams,
  ]);

  // Fetch data when component mounts if we have required parameters
  useEffect(() => {
    if (moduleIds && selectedSensor) {
      fetchData();
    }
  }, []); // Only run on mount

  const convertToUTC = (localDateTime: string) => {
    if (!localDateTime) return "";
    const date = new Date(localDateTime);
    return date.toISOString().slice(0, 19) + "Z";
  };

  const formatLocalTime = (utcTime: string) => {
    // Ensure the time string has the Z suffix for UTC
    const timeWithZ = utcTime.endsWith("Z") ? utcTime : utcTime + "Z";
    return format(parseISO(timeWithZ), "M/d h:mm:ss a");
  };

  const formatLocalTimeShort = (utcTime: string) => {
    // Ensure the time string has the Z suffix for UTC
    const timeWithZ = utcTime.endsWith("Z") ? utcTime : utcTime + "Z";
    return format(parseISO(timeWithZ), "M/d h:mm a");
  };

  const fetchData = async () => {
    if (!moduleIds || !selectedSensor) {
      toast.error("Please enter module IDs and select a sensor");
      return;
    }

    const ids = moduleIds.split(",").map((id) => id.trim());
    if (ids.length === 0) {
      toast.error("Please enter at least one module ID");
      return;
    }

    setLoading(true);
    try {
      const allData = await Promise.all(
        ids.map(async (smid, index) => {
          const params = new URLSearchParams({
            smid,
            sensors: selectedSensor,
            fill: fillMethod,
          });

          if (startTime) {
            params.append("start", convertToUTC(startTime));
          }
          if (endTime) {
            params.append("end", convertToUTC(endTime));
          }

          const response = await axios.get(
            `${BACKEND_URL}/query/historic?${params.toString()}`,
          );
          return response.data.map((item: any) => ({
            ...item,
            module_id: smid,
            color: MODULE_COLORS[index % MODULE_COLORS.length],
            local_time: formatLocalTime(item.created_at),
          }));
        }),
      );

      // Merge and sort all data by timestamp
      const mergedData = allData
        .flat()
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );

      setData(mergedData);
    } catch (error) {
      toast.error(getAxiosErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = data.reduce(
    (acc, item) => {
      if (!acc[item.module_id]) {
        acc[item.module_id] = {
          label: `Module ${item.module_id}`,
          color: item.color,
        };
      }
      return acc;
    },
    {} as Record<string, { label: string; color: string }>,
  );

  return (
    <Layout activeTab="query" headerTitle="Query">
      <div className="space-y-6 p-8">
        <Card className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="moduleIds">Module IDs (comma-separated)</Label>
              <Input
                id="moduleIds"
                value={moduleIds}
                onChange={(e) => setModuleIds(e.target.value)}
                placeholder="e.g. 1, 2, 3"
              />
            </div>
            <div className="space-y-2">
              <Label>Sensor</Label>
              <Select value={selectedSensor} onValueChange={setSelectedSensor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sensor" />
                </SelectTrigger>
                <SelectContent>
                  {SENSOR_OPTIONS.map((sensor) => (
                    <SelectItem key={sensor.value} value={sensor.value}>
                      {sensor.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fill Method</Label>
              <Select value={fillMethod} onValueChange={setFillMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fill method" />
                </SelectTrigger>
                <SelectContent>
                  {FILL_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchData} disabled={loading}>
                {loading ? "Loading..." : "Fetch Data"}
              </Button>
            </div>
          </div>
        </Card>

        {data.length > 0 && (
          <>
            <Card className="p-6">
              <div className="min-h-[50vh] w-full">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="created_at"
                        tickFormatter={(value) => formatLocalTimeShort(value)}
                      />
                      <YAxis />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(value) => formatLocalTime(value)}
                          />
                        }
                      />
                      <ChartLegend />
                      {Object.keys(chartConfig).map((moduleId) => (
                        <Area
                          key={moduleId}
                          type="monotone"
                          dataKey={selectedSensor}
                          data={data.filter(
                            (item) => item.module_id === moduleId,
                          )}
                          stroke={chartConfig[moduleId].color}
                          fill={chartConfig[moduleId].color}
                          fillOpacity={0.2}
                          name={`Module ${moduleId}`}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </Card>

            <Card className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Module ID</TableHead>
                    <TableHead>
                      {
                        SENSOR_OPTIONS.find(
                          (opt) => opt.value === selectedSensor,
                        )?.label
                      }
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.local_time}</TableCell>
                      <TableCell>{row.module_id}</TableCell>
                      <TableCell>{row[selectedSensor]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
