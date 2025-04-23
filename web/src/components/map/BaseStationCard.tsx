import { Satellite, Clock, LocateFixed, LocateOff } from "lucide-react";
import { BaseStation } from "@/models/base-station";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";

const BaseStationCard = ({ baseStation }: { baseStation: BaseStation }) => {
  const getOnlineStatus = () => {
    const lastPingTime = new Date(baseStation.last_ping + "Z").getTime();
    const currentTime = new Date().getTime();
    const hourInMilliseconds = 60 * 60 * 1000;
    return currentTime - lastPingTime <= hourInMilliseconds;
  };

  return (
    <div className="min-w-[350px] overflow-hidden">
      <div className="rounded-t-md border-b bg-neutral-50 p-4 dark:bg-black">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Satellite
                className={`h-5 w-5 ${getOnlineStatus() ? "text-green-500" : "text-neutral-400"}`}
              />
              <h3 className="font-semibold">{baseStation.name}</h3>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              ID: {baseStation.id}
            </p>
          </div>
          <div className="flex flex-col items-end justify-start gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs ${getOnlineStatus() ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-700"}`}
            >
              {getOnlineStatus() ? "Online" : "Offline"}
            </span>
            <div className="flex flex-1 flex-col flex-wrap items-end justify-start gap-2">
              {baseStation.latitude != 0 && baseStation.longitude != 0 ? (
                <Card
                  className={`w-min border-none px-[6px] py-[3px] text-center ${getOnlineStatus() ? "bg-green-500 dark:bg-green-500/60" : "bg-neutral-400 dark:bg-neutral-400/60"}`}
                >
                  <div className="flex items-center gap-1">
                    <LocateFixed className="h-4 w-4 text-white" />
                  </div>
                </Card>
              ) : (
                <Card
                  className={`w-min border-none px-[6px] py-[3px] text-center ${getOnlineStatus() ? "bg-yellow-500 dark:bg-yellow-500/60" : "bg-neutral-400 dark:bg-neutral-400/60"}`}
                >
                  <div className="flex items-center gap-1">
                    <LocateOff className="h-4 w-4 text-white" />
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-b-md border-t bg-neutral-50 p-3 dark:bg-black">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Clock className="h-3 w-3" />
          <span>
            Last updated{" "}
            {formatDistanceToNow(new Date(baseStation.last_ping + "Z"), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BaseStationCard;
