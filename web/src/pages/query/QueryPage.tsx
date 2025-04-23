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
import { Checkbox } from "@/components/ui/checkbox";
import { X, TableProperties, Maximize2, Minimize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [selectedSensors, setSelectedSensors] = useState<string[]>(
    searchParams.get("sensors")?.split(",") || [],
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
  const [fetchedSensors, setFetchedSensors] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

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

  // Fetch data on page load if URL parameters are present
  useEffect(() => {
    const hasParams =
      searchParams.has("modules") && searchParams.has("sensors");
    if (hasParams) {
      fetchData();
    }
  }, []); // Only run on mount

  const fetchData = async () => {
    if (!moduleIds || selectedSensors.length === 0) {
      toast.error("Please enter module IDs and select at least one sensor");
      return;
    }

    const ids = moduleIds.split(",").map((id) => id.trim());
    if (ids.length === 0) {
      toast.error("Please enter at least one module ID");
      return;
    }

    // Update URL parameters when fetching
    const params = new URLSearchParams();
    if (moduleIds) params.set("modules", moduleIds);
    if (selectedSensors.length > 0)
      params.set("sensors", selectedSensors.join(","));
    if (startTime) params.set("start", startTime);
    if (endTime) params.set("end", endTime);
    if (fillMethod) params.set("fill", fillMethod);
    setSearchParams(params);

    setLoading(true);
    try {
      const allData = await Promise.all(
        ids.map(async (smid, index) => {
          const params = new URLSearchParams({
            smid,
            sensors: selectedSensors.join(","),
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
      setFetchedSensors([...selectedSensors]);
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
              <Select
                value={selectedSensors.join(",")}
                onValueChange={(value) =>
                  setSelectedSensors(value ? value.split(",") : [])
                }
              >
                <SelectTrigger className="flex h-auto min-h-[2.5rem] flex-wrap gap-2">
                  {selectedSensors.length === 0 ? (
                    <SelectValue placeholder="Select sensors" />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedSensors.map((sensor) => (
                        <div
                          key={sensor}
                          className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-sm"
                        >
                          <span className="whitespace-nowrap">
                            {
                              SENSOR_OPTIONS.find((opt) => opt.value === sensor)
                                ?.label
                            }
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedSensors(
                                selectedSensors.filter((v) => v !== sensor),
                              );
                            }}
                            className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {SENSOR_OPTIONS.map((sensor) => (
                    <div
                      key={sensor.value}
                      className="flex items-center space-x-2 p-2"
                    >
                      <Checkbox
                        id={sensor.value}
                        checked={selectedSensors.includes(sensor.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSensors([
                              ...selectedSensors,
                              sensor.value,
                            ]);
                          } else {
                            setSelectedSensors(
                              selectedSensors.filter((v) => v !== sensor.value),
                            );
                          }
                        }}
                      />
                      <Label htmlFor={sensor.value}>{sensor.label}</Label>
                    </div>
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
            <div className="mb-4 flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <TableProperties className="mr-2 h-4 w-4" />
                    Open Data Explorer
                  </Button>
                </DialogTrigger>
                <DialogContent className="h-[90vh] max-w-[90vw]">
                  <DialogHeader>
                    <DialogTitle>Data Explorer</DialogTitle>
                  </DialogHeader>
                  <div className="flex h-[calc(90vh-8rem)] gap-4">
                    <ScrollArea className="w-64 rounded-md border p-4">
                      <div className="space-y-2">
                        {Object.keys(chartConfig).map((moduleId) => (
                          <Button
                            key={moduleId}
                            variant={
                              selectedModule === moduleId ? "default" : "ghost"
                            }
                            className="w-full justify-start"
                            onClick={() => setSelectedModule(moduleId)}
                          >
                            Module {moduleId}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="flex-1">
                      {selectedModule ? (
                        <ScrollArea className="h-full">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Timestamp</TableHead>
                                {fetchedSensors.map((sensor) => (
                                  <TableHead key={sensor}>
                                    {
                                      SENSOR_OPTIONS.find(
                                        (opt) => opt.value === sensor,
                                      )?.label
                                    }
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data
                                .filter(
                                  (item) => item.module_id === selectedModule,
                                )
                                .map((row, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{row.local_time}</TableCell>
                                    {fetchedSensors.map((sensor) => (
                                      <TableCell key={sensor}>
                                        {row[sensor]?.toFixed(2) || "-"}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          Select a module to view data
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {fetchedSensors.map((sensor) => (
                <Card
                  key={sensor}
                  className="relative p-6"
                  style={{
                    gridColumn: expandedChart === sensor ? "1 / -1" : "auto",
                    width: expandedChart === sensor ? "100%" : "auto",
                  }}
                >
                  <div className="absolute right-4 top-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setExpandedChart(
                          expandedChart === sensor ? null : sensor,
                        )
                      }
                    >
                      {expandedChart === sensor ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <h3 className="mb-4 text-lg font-semibold">
                    {SENSOR_OPTIONS.find((opt) => opt.value === sensor)?.label}
                  </h3>
                  <div
                    style={{
                      height: expandedChart === sensor ? "60vh" : "30vh",
                    }}
                  >
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={data}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="created_at"
                            tickFormatter={(value) =>
                              formatLocalTimeShort(value)
                            }
                          />
                          <YAxis />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                labelFormatter={(value) =>
                                  formatLocalTime(value)
                                }
                              />
                            }
                          />
                          <ChartLegend />
                          {Object.keys(chartConfig).map((moduleId) => (
                            <Area
                              key={moduleId}
                              type="monotone"
                              dataKey={sensor}
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
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
