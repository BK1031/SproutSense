import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button"
import { BACKEND_URL } from "@/consts/config";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import { useRefreshInterval } from "@/lib/store";
import axios from "axios";
import { Sprout, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";


export function CurrentNPKCard() {
  const [NPK] = useState("NPK");
  const [nitrogen, setNitrogen] = useState(0)
  const [phosphorus, setPhosphorus] = useState(0)
  const [potassium, setPotassium] = useState(0)
  const [selectedView, setSelectedView] = useState("averages")


  const refreshInterval = useRefreshInterval();

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

  return (
    <Card className="h-full w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex flex-row items-center gap-2">
          <Sprout className="h-5 w-5 text-muted-foreground" />
          <span className="text-xl font-semibold">
            {NPK || "Loading..."}
          </span>
        </CardTitle>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuRadioGroup value={selectedView} onValueChange={setSelectedView}>
                    <DropdownMenuRadioItem value="averages">Averages</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="graph">Graph View</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {selectedView == 'averages' && (
        <div className="grid gap-2 mb-3">
            <div className="flex items-center gap-2">
            <span className="text-base">
                <span className="font-bold text-xl">N:</span>
                <span className="text-muted-foreground"> {nitrogen} mg/kg </span>
            </span>
            </div>
            <div className="flex items-center gap-2">
            <span className="text-base">
                <span className="font-bold text-xl">P:</span>
                <span className="text-muted-foreground"> {phosphorus} mg/kg </span>
            </span>
            </div>
            <div className="flex items-center gap-2">
            <span className="text-base">
                <span className="font-bold text-xl">K:</span>
                <span className="text-muted-foreground"> {potassium} mg/kg </span>
            </span>
            </div>
        </div>
        )}

        {selectedView == 'graph' && (
        <div className="grid gap-2 mb-3">

        </div>
        )}
    
      </CardContent>
    </Card>
  );
}
