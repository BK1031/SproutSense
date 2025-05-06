import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/consts/config";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import { useRefreshInterval } from "@/lib/store";
import axios from "axios";
import {
  Droplets,
  TrendingUp,
  Leaf,
  TrendingDown,
  Menu,
  Maximize2,
  ChevronDown,
  MoveRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SensorModule {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  last_ping: string;
  created_at: string;
}

interface SoilMoisture {
  created_at: string;
  soil_moisture: number;
}

interface ChartData {
  soilMoisture: number;
  created_at: string;
  label: string;
  timestamp: Date;
}

const chartConfig = {
  soilMoisture: {
    label: "Soil Moisture",
    color: "hsl(210, 100%, 50%)",
  },
} satisfies ChartConfig;

export function CurrentSoilMoistureCard() {
  const [soilMoisture, setSoilMoisture] = useState(0);
  const [trendingDirection, setTrendingDirection] = useState("up");
  const [selectedView, setSelectedView] = useState("averages");
  const [expanded, setExpanded] = useState(false);
  const [sensorModules, setSensorModules] = useState<SensorModule[]>([]);
  const [module, setModule] = useState<string | undefined>("4");
  const [soilMoistureById, setSoilMoistureById] = useState<
    string | undefined
  >();
  const [graphFilter, setGraphFilter] = useState<string | undefined>("day");
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const refreshInterval = useRefreshInterval();

  const padGroupedData = (data: Map<number, number[]>, filter: any) => {
    if (filter === "year") {
      if (!data.has(0)) {
        data.set(0, [0]);
      }
    } else if (filter === "day") {
      if (!data.has(0)) {
        data.set(0, [0]);
      }
    } else if (filter === "week") {
      const currentDay = new Date();
      const startDay = new Date();
      startDay.setDate(currentDay.getDate() - 7);
      if (!data.has(startDay.getDate())) {
        data.set(startDay.getDate(), [0]);
      }
    } else if (filter === "month") {
      const currentDay = new Date();
      const startDay = new Date();
      startDay.setDate(currentDay.getDate() - 30);
      if (!data.has(startDay.getDate())) {
        data.set(startDay.getDate(), [0]);
      }
    }

    return data;
  };

  const groupData = (data: SoilMoisture[], filter: any) => {
    const groupedDataByFilter = new Map<number, number[]>();

    data.forEach((item) => {
      const date = new Date(item.created_at);
      let keyByFilter;
      if (filter === "day") {
        keyByFilter = date.getHours();

        if (!groupedDataByFilter.has(keyByFilter)) {
          groupedDataByFilter.set(keyByFilter, []);
        }
        groupedDataByFilter.get(keyByFilter)!.push(item.soil_moisture);
      } else if (filter === "week" || filter === "month") {
        keyByFilter = date.getDate();

        if (!groupedDataByFilter.has(keyByFilter)) {
          groupedDataByFilter.set(keyByFilter, []);
        }
        groupedDataByFilter.get(keyByFilter)!.push(item.soil_moisture);
      } else if (filter === "year") {
        keyByFilter = date.getMonth();

        if (!groupedDataByFilter.has(keyByFilter)) {
          groupedDataByFilter.set(keyByFilter, []);
        }
        groupedDataByFilter.get(keyByFilter)!.push(item.soil_moisture);
      }
    });

    return padGroupedData(groupedDataByFilter, filter);
  };

  const processData = (data: SoilMoisture[]) => {
    let endHour;
    let startHour;
    let filter;
    let startDate;
    let endDate;
    if (graphFilter === "day") {
      filter = graphFilter;
      endHour = new Date().getHours();
      startHour = 0;
      startDate = new Date();
      endDate = new Date();
    } else if (graphFilter === "week") {
      filter = graphFilter;
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      endHour = 0;
      startHour = 0;
    } else if (graphFilter === "month") {
      filter = graphFilter;
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      endHour = 0;
      startHour = 0;
    } else if (graphFilter === "year") {
      filter = graphFilter;
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(1);
      startDate.setMonth(0);
      startDate.setHours(0, 0, 0, 0);
      endHour = 0;
      startHour = 0;
    } else {
      endHour = 0;
      startHour = 0;
      startDate = new Date();
      endDate = new Date();
    }

    const graphData: ChartData[] = [];
    const groupedData = groupData(data, filter);
    let lastKnownValue: number | null = null;

    if (filter === "day") {
      while (startHour <= endHour) {
        const values = groupedData.get(startHour);
        let avg: number;

        if (values && values.length > 0 && values[0] >= 0) {
          avg = values.reduce((sum, v) => sum + v, 0) / values.length;
          lastKnownValue = avg;
        } else if (lastKnownValue != null) {
          avg = lastKnownValue;
        } else {
          startHour += 1;
          continue;
        }

        const xLabelDate = new Date();
        xLabelDate.setHours(startHour, 0, 0, 0);
        const xLabel = xLabelDate.toLocaleString("en-US", {
          timeZone: "America/Los_Angeles",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        graphData.push({
          soilMoisture: avg,
          created_at: xLabelDate.toISOString(),
          label: xLabel,
          timestamp: xLabelDate,
        });

        startHour += 1;
      }
    } else if (filter === "week" || filter === "month") {
      while (startDate <= endDate) {
        const dayOfMonth = startDate.getDate();
        const values = groupedData.get(dayOfMonth);
        let avg: number;

        if (values && values.length > 0) {
          avg = values.reduce((sum, v) => sum + v, 0) / values.length;
          lastKnownValue = avg;
        } else if (lastKnownValue != null) {
          avg = lastKnownValue;
        } else {
          startDate.setDate(startDate.getDate() + 1);
          continue;
        }
        const xLabel =
          (startDate.getMonth() + 1).toString() +
          "/" +
          startDate.getDate().toString();

        graphData.push({
          soilMoisture: avg,
          created_at: startDate.toISOString(),
          label: xLabel,
          timestamp: startDate,
        });

        startDate.setDate(startDate.getDate() + 1);
      }
    } else if (filter === "year") {
      while (startDate <= endDate) {
        const month = startDate.getMonth();
        const values = groupedData.get(month);
        let avg: number;

        if (values && values.length > 0) {
          avg = values.reduce((sum, v) => sum + v, 0) / values.length;
          lastKnownValue = avg;
        } else if (lastKnownValue != null) {
          avg = lastKnownValue;
        } else {
          startDate.setMonth(startDate.getMonth() + 1);
          continue;
        }

        const xLabel = startDate.toLocaleString("default", { month: "long" });

        graphData.push({
          soilMoisture: avg,
          created_at: startDate.toISOString(),
          label: xLabel,
          timestamp: startDate,
        });

        startDate.setMonth(startDate.getMonth() + 1);
      }
    }

    return graphData;
  };

  function renderSelectedView({
    expanded,
    selectedView,
  }: {
    expanded: boolean;
    selectedView: string;
  }) {
    if (selectedView == "latest" && !expanded) {
      return (
        <div className="grid gap-6">
          <div className="flex items-center gap-2">
            <Droplets className="h-6 w-6 text-muted-foreground" />
            <span className="text-4xl font-bold">{soilMoisture}%</span>
          </div>
          {trendingDirection === "up" ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-lg">Soil Moisture Increased</span>
            </div>
          ) : trendingDirection === "down" ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-lg">Soil Moisture Decreased</span>
            </div>
          ) : trendingDirection === "up-down" ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MoveRight className="h-5 w-5 text-gray-500" />
              <span className="text-lg">Soil Moisture Stable</span>
            </div>
          ) : null}
        </div>
      );
    } else if (selectedView == "averages") {
      return (
        <div className="grid gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm">
              Average Soil Moisture For Module {module ? module : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-6 w-6 text-muted-foreground" />
            {soilMoistureById !== undefined ? (
              <span className="text-4xl font-bold">{soilMoistureById}%</span>
            ) : (
              <span className="text-lg font-bold">No Moisture Data</span>
            )}
          </div>
        </div>
      );
    } else if (selectedView == "graph") {
      return (
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 5,
              left: 12,
              right: 12,
              bottom: 16,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            {expanded && (
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                unit=" %"
              />
            )}

            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <ChartLegend
              content={<ChartLegendContent />}
              wrapperStyle={{
                paddingTop: 0,
                marginBottom: 5,
              }}
            />
            <Line
              dataKey="soilMoisture"
              type="monotone"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      );
    }
  }
  useEffect(() => {
    if (graphFilter) {
      getHistoricSoilMoistureById();
    }
  }, [graphFilter, module]);

  useEffect(() => {
    if (module) {
      getSoilMoistureByModuleId();
    }
  }, [module]);

  useEffect(() => {
    getSoilMoisture();
    const interval = setInterval(getSoilMoisture, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    getSensorModules();
    const interval = setInterval(getSensorModules, refreshInterval * 5000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getSensorModules = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/sensor-module`);

      setSensorModules(response.data);
    } catch (error: any) {
      toast(getAxiosErrorMessage(error));
    }
  };
  const setStartAndEndStrings = async () => {
    let endISOString;
    let startISOString;
    if (graphFilter === "day") {
      const end = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      endISOString = end.toISOString();
      startISOString = start.toISOString();
    } else if (graphFilter === "week") {
      const end = new Date();
      const start = new Date();

      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      endISOString = end.toISOString();
      startISOString = start.toISOString();
    } else if (graphFilter === "month") {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      endISOString = end.toISOString();
      startISOString = start.toISOString();
    } else if (graphFilter === "year") {
      const end = new Date();
      const start = new Date();

      start.setDate(1);
      start.setMonth(0);
      start.setHours(0, 0, 0, 0);
      endISOString = end.toISOString();
      startISOString = start.toISOString();
    }

    return {
      startISOString,
      endISOString,
    };
  };

  const getHistoricSoilMoistureById = async () => {
    try {
      const queryStrings = await setStartAndEndStrings();
      const response = await axios.get(
        `${BACKEND_URL}/query/historic?smid=${module}&sensors=soil_moisture&start=${queryStrings.startISOString}&end=${queryStrings.endISOString}`,
      );
      const data: SoilMoisture[] = response.data;

      setChartData(processData(data));
    } catch (error: any) {
      setChartData([]);
      toast(getAxiosErrorMessage(error));
    }
  };

  const getSoilMoistureByModuleId = async () => {
    try {
      // replace this with historic avg api when its implemented
      const currentModuleId = module;
      const response = await axios.get(
        `${BACKEND_URL}/query/latest?sensors=soil_moisture&smid=${currentModuleId}`,
      );
      const fixedSoilMoisture = response.data.soil_moisture.toFixed(2);
      setSoilMoistureById(fixedSoilMoisture);
    } catch (error: any) {
      setSoilMoistureById(undefined);
      toast(getAxiosErrorMessage(error));
    }
  };

  const getSoilMoisture = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/query/latest?sensors=soil_moisture`,
      );
      const fixedSoilMoisture = response.data.soil_moisture.toFixed(2);
      if (fixedSoilMoisture > soilMoisture) {
        setTrendingDirection("down");
      } else if (fixedSoilMoisture < soilMoisture) {
        setTrendingDirection("up");
      } else {
        setTrendingDirection("up-down");
      }
      setSoilMoisture(response.data.soil_moisture.toFixed(2));
    } catch (error: any) {
      toast(getAxiosErrorMessage(error));
    }
  };

  return (
    <>
      <Card className="h-full w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex flex-row items-center gap-2">
            <Leaf className="h-5 w-5 text-muted-foreground" />
            <span className="text-xl font-semibold">{"Soil Moisture"}</span>
          </CardTitle>
          <div className="flex items-center gap-1">
            {selectedView == "averages" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronDown className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuRadioGroup
                    value={module}
                    onValueChange={setModule}
                  >
                    {sensorModules.map((module) => (
                      <DropdownMenuRadioItem
                        key={module.id}
                        value={module.id.toString()}
                      >
                        Module {module.id}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuRadioGroup
                  value={selectedView}
                  onValueChange={setSelectedView}
                >
                  <DropdownMenuRadioItem value="latest">
                    Latest
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="averages">
                    Averages
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="graph">
                    Graph View
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedView != "averages" && selectedView != "latest" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setExpanded(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {renderSelectedView({ expanded: false, selectedView: selectedView })}
        </CardContent>
      </Card>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-h-[80vh] sm:max-w-[800px]">
          <DialogHeader className="flex items-center justify-between">
            <DialogTitle>
              <div className="flex items-center gap-2 text-xl font-semibold">
                <Leaf className="h-5 w-5 text-muted-foreground" />
                <span className="text-xl font-semibold">{"Soil Moisture"}</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedView == "graph" && (
            <ToggleGroup
              variant="outline"
              type="single"
              value={graphFilter}
              onValueChange={(value) => {
                if (value) setGraphFilter(value);
              }}
            >
              <ToggleGroupItem value="day" aria-label="Toggle day">
                <span className="text-xl text-muted-foreground">{"1D"}</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="week" aria-label="Toggle week">
                <span className="text-xl text-muted-foreground">{"1W"}</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="month" aria-label="Toggle month">
                <span className="text-xl text-muted-foreground">{"1M"}</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="year" aria-label="Toggle year">
                <span className="text-xl text-muted-foreground">{"1Y"}</span>
              </ToggleGroupItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronDown className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuRadioGroup
                    value={module}
                    onValueChange={setModule}
                  >
                    {sensorModules.map((module) => (
                      <DropdownMenuRadioItem
                        key={module.id}
                        value={module.id.toString()}
                      >
                        Module {module.id}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </ToggleGroup>
          )}

          <div className="w-full">
            {renderSelectedView({ expanded: true, selectedView: selectedView })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
