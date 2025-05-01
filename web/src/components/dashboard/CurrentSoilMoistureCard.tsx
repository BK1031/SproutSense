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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/consts/config";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import { useRefreshInterval } from "@/lib/store";
import axios from "axios";
import { Droplets, TrendingUp, Leaf, TrendingDown, Menu, Maximize2, ChevronDown} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SensorModule {
    id: number,
    name: string,
    latitude: number,
    longitude: number,
    last_ping: string,
    created_at: string
}

interface SoilMoisture {
    created_at: string,
    soil_moisture: number
}

interface ChartDataDaily {
    soil_moisture: number,
    created_at : string,
    label: string,
    timestamp: Date
}

const chartConfig = {
    SoilMoisture: {
      label: "Soil Moisture",
      color: "hsl(var(--chart-1))",
    }

  } satisfies ChartConfig;

export function CurrentSoilMoistureCard() {
  const [soilMoisture, setSoilMoisture] = useState(0);
  const [trendingDirection, setTrendingDirection] = useState("up")
  const [selectedView, setSelectedView] = useState("averages");
  const [expanded, setExpanded] = useState(false);
  const [sensorModules, setSensorModules] = useState<SensorModule[]>([]);
  const [module, setModule] = useState<string | undefined>();
  const [soilMoistureById, setSoilMoistureById] = useState<string | undefined>();
  const [graphFilter, setGraphFilter] = useState<string |undefined>("day");
  const [chartDataDaily, setChartDataDaily] = useState<ChartDataDaily[]>([]);


  const refreshInterval = useRefreshInterval();

  const processData = (data: SoilMoisture[]) => {
    let graphData = data.map(item => {
        const date = new Date(item.created_at + 'Z');
        const pstTime = date.toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true

        });


        return {
            soil_moisture: item.soil_moisture,
            created_at : item.created_at,
            label: pstTime,
            timestamp: date
        } satisfies ChartDataDaily
    })

    graphData.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());

    return graphData;
  }

  function renderSelectedView({
    expanded,
    selectedView,
  }: {
    expanded: boolean;
    selectedView: string;
  }){

    if (selectedView == "latest" && !expanded) {
        return(
            <div className="grid gap-6">
                <div className="flex items-center gap-2">
                    <Droplets className="h-6 w-6 text-muted-foreground" />
                    <span className="text-4xl font-bold">{soilMoisture}%</span>
                </div>
                {trendingDirection === "up" ?(
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-5 w-5 text-green-500"/>
                        <span className="text-lg">Soil Moisture Increased</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingDown className="h-5 w-5 text-red-500"/>
                        <span className="text-lg">Soil Moisture Decreased</span>
                    </div>
                )}
          </div>       
        )
    
    } else if (selectedView == "averages") {
        return(
            <div className="grid gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-sm">Average Soil Moisture For Module {module ? module : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Droplets className="h-6 w-6 text-muted-foreground" />
                    {soilMoistureById !== undefined  ? (
                        <span className="text-4xl font-bold">{soilMoistureById}%</span>
                    ) : (
                        <span className="text-lg font-bold">No Moisture Data</span>
                    )}
                </div>
          </div>       
        )
    } else if (selectedView == "graph") {
        return(
            <ChartContainer config={chartConfig}>
            <LineChart
              accessibilityLayer
              // data={expanded ? chartData : chartData.slice(0, 6)}
              data={chartDataDaily}
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
                // dataKey={graphFilter === "day" ? "time" : "label"}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              //   tickFormatter={(value) => value.slice(0, 3)}
              />
              {expanded && (
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  unit=" mg/kg"
                />
              )}
  
              <ChartTooltip
                cursor={false}
                content={
                      <ChartTooltipContent/>
                 }
              />
              <ChartLegend
                content={<ChartLegendContent />}
                wrapperStyle={{
                  paddingTop: 0,
                  marginBottom: 5,
                }}
              />
              <Line
                dataKey="soil_moisture"
              //   dataKey="nitrogen"
                type="monotone"
                stroke="hsl(var(--chart-1))"
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
  }, [graphFilter]);

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
  }, [refreshInterval])

  const getSensorModules = async () => {
    try {
        const response = await axios.get(
            `${BACKEND_URL}/sensor-module`,
        );

        setSensorModules(response.data);


    } catch (error:any) {
        toast(getAxiosErrorMessage(error));
    }
  }

  const getHistoricSoilMoistureById = async () => {
    try {
        const response = await axios.get(
            `${BACKEND_URL}/query/historic?smid=5&sensors=soil_moisture`,
        );
        const data: SoilMoisture[] = response.data;

        // call process data here
        setChartDataDaily(processData(data));
        // build chart after?
        


    } catch (error:any) {
        toast(getAxiosErrorMessage(error));
    }
  }

  const getSoilMoistureByModuleId = async () => {
    try {
        // replace this with historic avg api when its implemented
        const currentModuleId = module;
        const response = await axios.get(
            `${BACKEND_URL}/query/latest?sensors=soil_moisture&smid=${currentModuleId}`,
        );
        const fixedSoilMoisture = response.data.soil_moisture.toFixed(2);
        setSoilMoistureById(fixedSoilMoisture);
    } catch (error:any) {
        setSoilMoistureById(undefined);
        toast(getAxiosErrorMessage(error));
    }
  }

  const getSoilMoisture = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/query/latest?sensors=soil_moisture`,
      );
      const fixedSoilMoisture = response.data.soil_moisture.toFixed(2);
    //   if the same then what do we want to render? some neutral trend icon
      if (fixedSoilMoisture > soilMoisture) {
        setTrendingDirection("down");
      } else {
        setTrendingDirection("up");
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
            <span className="text-xl font-semibold">
                {"Soil Moisture"}
            </span>
            </CardTitle>
            <div className="flex items-center gap-1">
                {selectedView == "averages" &&
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
                                    <DropdownMenuRadioItem key={module.id} value={module.id.toString()}>
                                        Module {module.id}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                }
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
                {selectedView != "averages" && selectedView != "latest" &&
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setExpanded(true)}
                    >
                    <Maximize2 className="h-4 w-4" />
                    </Button>
                }
            </div>        
        </CardHeader>
        <CardContent>
            {renderSelectedView({ expanded: false, selectedView: selectedView })}
        </CardContent>
        </Card>
        <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-h-[80vh] sm:max-w-[800px]">
          <DialogHeader className = "flex items-center justify-between">
            <DialogTitle>
                <div className="flex items-center gap-2 text-xl font-semibold">
                    <Leaf className="h-5 w-5 text-muted-foreground"/>
                    <span className="text-xl font-semibold">
                        {"Soil Moisture"}
                    </span>
                </div>
            </DialogTitle>
          </DialogHeader>
          {selectedView == "graph" && (
            <ToggleGroup variant="outline" 
                type="single"
                value={graphFilter}
                onValueChange={(value=> {
                    if (value) setGraphFilter(value);
                })}
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
                        <Menu className="h-4 w-4" />
                        <span className="sr-only">Settings</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuRadioGroup
                            value={module}
                            onValueChange={setModule}
                        >
                            <DropdownMenuRadioItem value="all">
                                All Modules
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="sensor module 4">
                                Sensor Module 4
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="sensor module 5">
                                Sensor Module 5
                            </DropdownMenuRadioItem>
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
