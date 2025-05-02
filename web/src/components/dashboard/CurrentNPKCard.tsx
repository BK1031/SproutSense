import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/consts/config";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import { useRefreshInterval } from "@/lib/store";
import axios from "axios";
import { Sprout, Menu, Maximize2, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";



const chartConfig = {
  N: {
    label: "Nitrogen",
    color: "hsl(var(--chart-1))",
  },
  P: {
    label: "Phosphorus",
    color: "hsl(var(--chart-2))",
  },
  K: {
    label: "Potassium",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

type NPKDataItem = {
    id: number,
    created_at: string,
    nitrogen: number,
    potassium: number,
    phosphorus: number

}

interface ChartData {
  N: number | null,
  P: number | null,
  K: number | null,
  created_at : string,
  label: string,
  timestamp: Date
}

interface SensorModule {
  id: number,
  name: string,
  latitude: number,
  longitude: number,
  last_ping: string,
  created_at: string
}


interface GroupedNPKMaps {
  nitrogenMap: Map<number, number[]>,
  phosphorusMap: Map<number, number[]>,
  potassiumMap: Map<number, number[]>
}



export function CurrentNPKCard() {
  const [NPK] = useState("NPK");
  const [nitrogen, setNitrogen] = useState(0);
  const [phosphorus, setPhosphorus] = useState(0);
  const [potassium, setPotassium] = useState(0);
  const [selectedView, setSelectedView] = useState("latest");
  const [expanded, setExpanded] = useState(false);
  const [sensorModules, setSensorModules] = useState<SensorModule[]>([]);
  const [nitrogenById, setNitrogenById] = useState<number | undefined>();
  const [potassiumById, setPotassiumById] = useState<number | undefined>();
  const [phosphorusById, setPhosphorusById] = useState<number | undefined>();
  const [module, setModule] = useState<string | undefined>("4");
  const [graphFilter, setGraphFilter] = useState("day");
  const [graphData, setGraphData] = useState<ChartData[]>([]);

  function renderSelectedView({
    expanded,
    selectedView,
  }: {
    expanded: boolean;
    selectedView: string;
  }) {
    if (selectedView == "latest") {
      return (
        <div className={`grip gap-2 ${expanded ? "mb-6" : "mb-3"}`}>
          <div className="flex items-center gap-2">
            <span className="text-base">
              <span className="text-xl font-bold">N:</span>
              <span className="text-muted-foreground"> {nitrogen} mg/kg </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">
              <span className="text-xl font-bold">P:</span>
              <span className="text-muted-foreground">
                {" "}
                {phosphorus} mg/kg{" "}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">
              <span className="text-xl font-bold">K:</span>
              <span className="text-muted-foreground"> {potassium} mg/kg </span>
            </span>
          </div>
        </div>
      );
    } else if (selectedView == "graph") {
      return (
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={graphData}
            margin={{
              top: 5,
              left: 12,
              right: 12,
              bottom: 16,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={"label"}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
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
              dataKey="N"
              type="monotone"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="P"
              type="monotone"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="K"
              type="monotone"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
    
        </ChartContainer>
      );
    } else if (selectedView === "averages") {
      return(
        <div className="grid gap-6">
          <div className="flex items-center gap-2">
              <span className="text-sm">Average NPK For Module {module ? module : ""}</span>
          </div>
          <div className="flex items-center gap-2">
              {nitrogenById !== undefined  ? (
                  <span className="text-xl font-bold"> N: {nitrogenById}</span>
              ) : (
                  <span className="text-lg font-bold">N: </span>
              )}
              {phosphorusById !== undefined  ? (
                  <span className="text-xl font-bold"> P: {phosphorusById}</span>
              ) : (
                  <span className="text-lg font-bold">P: </span>
              )}
              {potassiumById !== undefined  ? (
                  <span className="text-xl font-bold"> K: {potassiumById}</span>
              ) : (
                  <span className="text-lg font-bold">K: </span>
              )}
          </div>
        </div>
      );
    }
  }

  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    if(graphFilter){
      getHistoricNPK();
    }
  }, [graphFilter, module]);

  useEffect(() => {
    getNPK();
    const interval = setInterval(getNPK, refreshInterval * 1000);
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

  const getNPK = async () => {
    try {
      // i dont think this is takign the avg?
      const response = await axios.get(
        `${BACKEND_URL}/query/latest?sensors=nitrogen,phosphorus,potassium`,
      );
      setNitrogen(response.data.nitrogen);
      setPhosphorus(response.data.phosphorus);
      setPotassium(response.data.potassium);
    } catch (error: any) {
      toast(getAxiosErrorMessage(error));
    }
  };

  useEffect(() => {
    if (module) {
        getHistoricNPKAvgById();
    }
  }, [module]);

  const getHistoricNPKAvgById = async () => {
    try {
        const currentModuleId = module;
        const response = await axios.get(
            `${BACKEND_URL}/query/latest?&sensors=nitrogen,phosphorus,potassium&smid=${currentModuleId}`,
        );
        setNitrogenById(response.data.nitrogen);
        setPhosphorusById(response.data.phosphorus);
        setPotassiumById(response.data.potassium);
    } catch (error:any) {
        setNitrogenById(undefined);
        setPhosphorusById(undefined);
        setPotassiumById(undefined);
        toast(getAxiosErrorMessage(error));
    }
  }

  const padGroupedData = (data: GroupedNPKMaps, filter:any) => {
    const nitrogenMap = data.nitrogenMap;
    const phosphorusMap = data.phosphorusMap;
    const potassiumMap = data.potassiumMap
    if (filter === "year" || filter === "day") {
      if (!nitrogenMap.has(0)) {
        nitrogenMap.set(0, [0]);
      }
      if (!phosphorusMap.has(0)) {
        phosphorusMap.set(0, [0]);
      }
      if (!potassiumMap.has(0)) {
        potassiumMap.set(0, [0]);
      }           
    } else if (filter === "week") {
        const currentDay = new Date();
        const startDay = new Date();
        startDay.setDate(currentDay.getDate() - 7);
        if (!nitrogenMap.has(startDay.getDate())) {
          nitrogenMap.set(startDay.getDate(), [0]);
        }
        if (!phosphorusMap.has(startDay.getDate())) {
          phosphorusMap.set(startDay.getDate(), [0]);
        }
        if (!potassiumMap.has(startDay.getDate())) {
          potassiumMap.set(startDay.getDate(), [0]);
        }              
    } else if (filter === "month") {
        const currentDay = new Date();
        const startDay = new Date();
        startDay.setDate(currentDay.getDate() - 30);
        if (!nitrogenMap.has(startDay.getDate())) {
          nitrogenMap.set(startDay.getDate(), [0]);
        }
        if (!phosphorusMap.has(startDay.getDate())) {
          phosphorusMap.set(startDay.getDate(), [0]);
        }
        if (!potassiumMap.has(startDay.getDate())) {
          potassiumMap.set(startDay.getDate(), [0]);
        }   
    }

    const result: GroupedNPKMaps = {
      nitrogenMap,
      phosphorusMap,
      potassiumMap
    }

    return result;
}

const groupData = (data: NPKDataItem[], filter:any): GroupedNPKMaps => {
  const nitrogenMap = new Map<number, number[]>();
  const phosphorusMap = new Map<number, number[]>();
  const potassiumMap = new Map<number, number[]>();

  data.forEach(item => {
      const date = new Date(item.created_at + 'Z');
      let keyByFilter: number;
      if (filter === "day") {
          keyByFilter = date.getHours();
      } else if (filter === "week" || filter === "month") {
          keyByFilter = date.getDate();

      } else if (filter === "year") {
          keyByFilter = date.getMonth();         
      } else {
        throw new Error("Invalid Filter Type");
      }

      if (!nitrogenMap.has(keyByFilter)) {
        nitrogenMap.set(keyByFilter, []);
      }
      if (!phosphorusMap.has(keyByFilter)) {
        phosphorusMap.set(keyByFilter, []);
      }
      if (!potassiumMap.has(keyByFilter)) {
        potassiumMap.set(keyByFilter, []);
      }

      nitrogenMap.get(keyByFilter)!.push(item.nitrogen);
      phosphorusMap.get(keyByFilter)!.push(item.phosphorus);
      potassiumMap.get(keyByFilter)!.push(item.potassium);  
  })


  const result: GroupedNPKMaps = {
    nitrogenMap,
    phosphorusMap,
    potassiumMap
  }

  return padGroupedData(result, filter);
}
  
  const processData = (data: NPKDataItem[]) => {
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
    const groupedNitrogen = groupedData.nitrogenMap;
    const groupedPhosphorus = groupedData.phosphorusMap;
    const groupedPotassium = groupedData.potassiumMap;
    
    let lastKnownN: number | null = null;
    let lastKnownP: number | null = null;
    let lastKnownK: number | null = null;

    if (filter === "day") {
        while( startHour <= endHour ) {
            const valuesN = groupedNitrogen.get(startHour);
            const valuesP = groupedPhosphorus.get(startHour);
            const valuesK = groupedPotassium.get(startHour);

            let avgN: number | null = null;
            let avgP: number | null = null;
            let avgK: number | null = null;

            avgN = valuesN?.length ? valuesN.reduce((a, b) => a + b, 0) / valuesN.length : lastKnownN;
            avgP = valuesP?.length ? valuesP.reduce((a, b) => a + b, 0) / valuesP.length : lastKnownP;
            avgK = valuesK?.length ? valuesK.reduce((a, b) => a + b, 0) / valuesK.length : lastKnownK;


            if(avgN == null && avgP == null && avgK == null){
              startHour += 1;
              continue;
            }


            if (avgN != null) {
              lastKnownN = avgN;
            }
            if (avgP != null) {
              lastKnownP = avgP;
            }
            if (avgK != null) {
              lastKnownK = avgK;
            }

            const xLabelDate = new Date();
            let xLabel;
            xLabelDate.setHours(startHour, 0, 0, 0);
            xLabel = xLabelDate.toLocaleString('en-US', {
                timeZone: 'America/Los_Angeles',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            graphData.push({
                N: avgN,
                P: avgP,
                K: avgK,
                created_at: xLabelDate.toISOString(),
                label: xLabel,
                timestamp: xLabelDate
            });
            startHour +=1;     
        }
    } else if (filter === "week" || filter === "month") {
          while( startDate <= endDate ) {
            const dayOfMonth = startDate.getDate();

            const valuesN = groupedNitrogen.get(dayOfMonth);
            const valuesP = groupedPhosphorus.get(dayOfMonth);
            const valuesK = groupedPotassium.get(dayOfMonth);

            let avgN: number | null = null;
            let avgP: number | null = null;
            let avgK: number | null = null;

            avgN = valuesN?.length ? valuesN.reduce((a, b) => a + b, 0) / valuesN.length : lastKnownN;
            avgP = valuesP?.length ? valuesP.reduce((a, b) => a + b, 0) / valuesP.length : lastKnownP;
            avgK = valuesK?.length ? valuesK.reduce((a, b) => a + b, 0) / valuesK.length : lastKnownK;
    
            if(avgN == null && avgP == null && avgK == null){
              startHour += 1;
              continue;
            }


            if (avgN != null) {
              lastKnownN = avgN;
            }
            if (avgP != null) {
              lastKnownP = avgP;
            }
            if (avgK != null) {
              lastKnownK = avgK;
            }

            const xLabel = (startDate.getMonth() + 1).toString() + "/" + startDate.getDate().toString();

            graphData.push({
                N: avgN,
                P: avgP,
                K: avgK,
                created_at: startDate.toISOString(),
                label: xLabel,
                timestamp: startDate
            });
    
            startDate.setDate(startDate.getDate() + 1);
        } 
    } else if (filter  === "year") {
          while( startDate <= endDate ) {
            const month = startDate.getMonth();

            const valuesN = groupedNitrogen.get(month);
            const valuesP = groupedPhosphorus.get(month);
            const valuesK = groupedPotassium.get(month);

            let avgN: number | null = null;
            let avgP: number | null = null;
            let avgK: number | null = null;

            avgN = valuesN?.length ? valuesN.reduce((a, b) => a + b, 0) / valuesN.length : lastKnownN;
            avgP = valuesP?.length ? valuesP.reduce((a, b) => a + b, 0) / valuesP.length : lastKnownP;
            avgK = valuesK?.length ? valuesK.reduce((a, b) => a + b, 0) / valuesK.length : lastKnownK;

            if(avgN == null && avgP == null && avgK == null){
              startHour += 1;
              continue;
            }


            if (avgN != null) {
              lastKnownN = avgN;
            }
            if (avgP != null) {
              lastKnownP = avgP;
            }
            if (avgK != null) {
              lastKnownK = avgK;
            }
            const xLabel = startDate.toLocaleString('default', { month: 'long' })

            graphData.push({
              N: avgN,
              P: avgP,
              K: avgK,
              created_at: startDate.toISOString(),
              label: xLabel,
              timestamp: startDate
          });
    
            startDate.setMonth(startDate.getMonth() + 1);
        }
    }
    return graphData;
 
  }

const setStartAndEndStrings = async () => {
  let endISOString;
  let startISOString;
  if (graphFilter === "day") {
      const end = new Date();
      const start =  new Date();
      // this is only for testing purposes, we wont have to do this if there is data for the current day
      end.setDate(30);
      end.setMonth(3);
      start.setDate(30);
      start.setMonth(3);
      start.setHours(0,0,0,0);
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
      // last 30 days
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
      endISOString
  }
}

const getHistoricNPK = async () => {
    try {
      const queryStrings = await setStartAndEndStrings();

      const response = await axios.get(
        `${BACKEND_URL}/query/historic?smid=${module}&sensors=nitrogen,phosphorus,potassium&start=${queryStrings.startISOString}&end=${queryStrings.endISOString}`,
      );
      
      const data: NPKDataItem[] = response.data;
      setGraphData(processData(data));


      
    } catch (error: any) {
      // toast(getAxiosErrorMessage(error));
      setGraphData([]);
    }
  };


  return (
    <>
      <Card className="h-full w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex flex-row items-center gap-2">
            <Sprout className="h-5 w-5 text-muted-foreground" />
            <span className="text-xl font-semibold">{NPK || "Loading..."}</span>
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
            {selectedView === "graph" &&
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
                    <Sprout className="h-5 w-5 text-muted-foreground"/>
                    <span>{NPK || "Loading..."}</span>
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
