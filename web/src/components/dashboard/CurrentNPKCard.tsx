import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/consts/config";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import { useRefreshInterval } from "@/lib/store";
import axios from "axios";
import { Sprout, Menu, Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

export function CurrentNPKCard() {
  const [NPK] = useState("NPK");
  const [nitrogen, setNitrogen] = useState(0);
  const [phosphorus, setPhosphorus] = useState(0);
  const [potassium, setPotassium] = useState(0);
  const [selectedView, setSelectedView] = useState("averages");
  const [expanded, setExpanded] = useState(false);

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
            data={expanded ? chartData : chartData.slice(0, 6)}
            margin={{
              left: 12,
              right: 12,
              bottom: 16,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
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
              content={<ChartTooltipContent hideLabel />}
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
              dot={true}
            />
            <Line
              dataKey="P"
              type="monotone"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={true}
            />
            <Line
              dataKey="K"
              type="monotone"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              dot={true}
            />
          </LineChart>
        </ChartContainer>
      );
    }
  }

  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    getNPK();
    const interval = setInterval(getNPK, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getNPK = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/query/historic?sensors=nitrogen,phosphorus,potassium`,
      );
      setNitrogen(response.data.nitrogen);
      setPhosphorus(response.data.phosphorus);
      setPotassium(response.data.potassium);
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Sprout className="h-5 w-5 text-muted-foreground" />
              {NPK || "Loading..."}
            </h2>
            <DialogClose asChild />
          </div>

          <div className="w-full">
            {renderSelectedView({ expanded: true, selectedView: selectedView })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
