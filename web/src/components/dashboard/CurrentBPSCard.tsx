import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BACKEND_URL } from "@/consts/config";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import axios from "axios";
import { Activity, Network } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function CurrentBPSCard() {
  const [avgBps, setAvgBps] = useState(0);
  const [totalBps, setTotalBps] = useState(0);

  const refreshInterval = 1;

  useEffect(() => {
    getBPS();
    const interval = setInterval(getBPS, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getBPS = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/bps/average`);
      setAvgBps(response.data.value);
      const totalResponse = await axios.get(`${BACKEND_URL}/bps/total`);
      setTotalBps(totalResponse.data.value);
    } catch (error: any) {
      toast(getAxiosErrorMessage(error));
    }
  };

  const formatBps = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)} MB/s`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} KB/s`;
    }
    return `${value.toFixed(2)} B/s`;
  };

  return (
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle className="flex flex-row items-center gap-2">
          <Network className="h-5 w-5 text-muted-foreground" />
          <span className="text-xl font-semibold">Network Throughput</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {/* Average BPS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium">Average BPS</span>
                <p className="text-xs text-muted-foreground">
                  Per base station
                </p>
              </div>
            </div>
            <span
              className={`text-2xl font-bold ${avgBps > 0 ? "text-green-500" : "text-neutral-500"}`}
            >
              {formatBps(avgBps)}
            </span>
          </div>

          {/* Total BPS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium">Total Network BPS</span>
                <p className="text-xs text-muted-foreground">
                  Across all base stations
                </p>
              </div>
            </div>
            <span
              className={`text-2xl font-bold ${totalBps > 0 ? "text-green-500" : "text-neutral-500"}`}
            >
              {formatBps(totalBps)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
