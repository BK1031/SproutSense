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
import { Sprout, Menu, Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GraphToggle } from "../ToggleGroup";
import { NumberDomain } from "recharts/types/util/types";

const chartData = [
  { month: "January", N: 150, P: 80, K: 210 },
  { month: "Februar", N: 100, P: 120, K: 700 },
  { month: "March", N: 50, P: 130, K: 100 },
  { month: "April", N: 75, P: 150, K: 240 },
  { month: "May", N: 75, P: 150, K: 280 },
  { month: "June", N: 150, P: 80, K: 210 },
  { month: "July", N: 100, P: 120, K: 700 },
  { month: "August", N: 50, P: 130, K: 100 },
  { month: "September", N: 75, P: 150, K: 240 },
  { month: "October", N: 75, P: 150, K: 280 },
  { month: "November", N: 75, P: 150, K: 280 },
  { month: "December", N: 75, P: 150, K: 280 },
];

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

interface ChartDataItem {
    time: string;
    timestamp: Date;
    fullTime: string;
    weeklyAxis: string;
    N: number;
    P: number;
    K: number;
  }

export function CurrentNPKCard() {
  const [NPK] = useState("NPK");
  const [nitrogen, setNitrogen] = useState(0);
  const [phosphorus, setPhosphorus] = useState(0);
  const [potassium, setPotassium] = useState(0);
  const [selectedView, setSelectedView] = useState("averages");
  const [expanded, setExpanded] = useState(false);
  const [npkData, setNPKData] = useState<NPKDataItem[]>([]);
  const [filteredNPKData, setFilteredNPKData] = useState<NPKDataItem[]>([]);
  const [module, setModule] = useState("sensor module 4");
  const [graphFilter, setGraphFilter] = useState("day");
  const [graphData, setGraphData] = useState<ChartDataItem[]>([]);

  function renderSelectedView({
    expanded,
    selectedView,
  }: {
    expanded: boolean;
    selectedView: string;
  }) {
    if (selectedView == "averages") {
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
            // data={expanded ? chartData : chartData.slice(0, 6)}
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
            //   dataKey="time"
              dataKey={graphFilter === "day" ? "time" : "weeklyAxis"}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
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
            //   dataKey="nitrogen"
              type="monotone"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="P"
            //   dataKey="phosphorus"
              type="monotone"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="K"
            //   datakey="potassium"
              type="monotone"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
    
        </ChartContainer>
      );
    }
  }

  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    getHistoricNPK()
  }, [graphFilter]);

  useEffect(() => {
    getNPK();
    const interval = setInterval(getNPK, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getNPK = async () => {
    try {
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
  
  const processData = (data: NPKDataItem[]): ChartDataItem[] => {
    const daysWithData = new Map<string, boolean>();
    let graphData =  data.map(item=>{
        const date = new Date(item.created_at + 'Z');
        console.log("current date", date);
        let currentMonth = date.getMonth();
        currentMonth += 1;
        const currentMonthString = currentMonth.toString();
        // console.log("current month", date.getMonth())
        const currentDay = date.getDate().toString();
        // console.log("current day", date.getDay())
        const pstTime = date.toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true

        });
        const timeLabel = pstTime;

        const weeklyLabel = currentMonthString + "/" + currentDay + ", " + timeLabel;

        daysWithData.set(`${currentMonth}/${date.getDate()}`, true);

        return {
            time: timeLabel,
            timestamp: date,
            fullTime: item.created_at,
            weeklyAxis: weeklyLabel,
            N: item.nitrogen,
            P: item.phosphorus,
            K: item.potassium
        };
    })
    //.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // const hasMidnightValue = graphData.some(item=> {
    //     const hour = item.timestamp.getHours();
    //     const minute = item.timestamp.getMinutes();

    //     return hour == 0 && minute == 0;
    // })

    // if (!hasMidnightValue && graphData.length > 0) {
    //     const date = new Date();
    //     date.setHours(0,0,0,0);

    //     const midnightTime = date.toLocaleString('en-US', {
    //         timeZone: 'America/Los_Angeles',
    //         hour: 'numeric',
    //         minute: '2-digit',
    //         hour12: true

    //     });

    //     let currentMonth = date.getMonth();
    //     currentMonth += 1;

    //     const currentMonthString = currentMonth.toString();

    //     const currentDay = date.getMonth();

    //     const weeklyLabel = currentMonthString + "/" + currentDay + ", "  + midnightTime;

    //     const firstEntry: ChartDataItem = {
    //         time: midnightTime,
    //         timestamp: date,
    //         weeklyAxis: weeklyLabel,
    //         fullTime: "",
    //         N: 0,
    //         P: 0,
    //         K: 0
    //     }
    //     graphData.unshift(firstEntry);
    // }

    // this has to be adjusted for the day view
    if (graphFilter === "week") {
        for(let i = 6; i >= 0; i--){
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0,0,0,0);
    
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const dateLabel = `${month}/${day}`;
            console.log(dateLabel);
    
            if (!daysWithData.has(dateLabel)) {
                graphData.push({
                    time: dateLabel,
                    timestamp: date,
                    weeklyAxis: dateLabel,
                    fullTime: "",
                    N: 0,
                    P: 0,
                    K: 0
                })
            }
        }
    }


    graphData.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());

    return graphData;
  }

const getHistoricNPK = async () => {
    try {

      if(graphFilter == "day"){

        const end = new Date();
        const start =  new Date();
        start.setHours(0,0,0,0);
        const endISOString = end.toISOString();
        const startISOString = start.toISOString();
        const response = await axios.get(
            `${BACKEND_URL}/query/historic?smid=5&sensors=nitrogen,potassium,phosphorus&start=${startISOString}&end=${endISOString}`,
        );

        const data: NPKDataItem[] = response.data;
        setGraphData(processData(data));
      }else if(graphFilter == "week"){

        const end = new Date();
        const start =  new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        start.setHours(0,0,0,0);
        const endISOString = end.toISOString();
        const startISOString = start.toISOString();
        const response = await axios.get(
            `${BACKEND_URL}/query/historic?smid=5&sensors=nitrogen,potassium,phosphorus&start=${startISOString}&end=${endISOString}`,
        );

        const data: NPKDataItem[] = response.data;
        // console.log("npk data", data);
        setGraphData(processData(data));
        // setFilteredNPKData(data)
      }

      
    } catch (error: any) {
      toast(getAxiosErrorMessage(error));
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
                  <DropdownMenuRadioItem value="averages">
                    Averages
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="graph">
                    Graph View
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setExpanded(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
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
