import { Satellite, Clock } from "lucide-react";
import { BaseStation } from "@/models/base-station";
import { formatDistanceToNow } from "date-fns";

const BaseStationCard = ({ baseStation }: { baseStation: BaseStation }) => {
  const getOnlineStatus = () => {
    const lastPingTime = new Date(baseStation.last_ping).getTime();
    const currentTime = new Date().getTime();
    const hourInMilliseconds = 60 * 60 * 1000;
    return currentTime - lastPingTime <= hourInMilliseconds;
  };

  return (
    <div className="w-[300px] overflow-hidden">
      <div className="rounded-t-md border-b bg-neutral-50 p-4 dark:bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite
              className={`h-5 w-5 ${getOnlineStatus() ? "text-green-500" : "text-neutral-400"}`}
            />
            <h3 className="font-semibold">{baseStation.name}</h3>
          </div>
          <span
            className={`rounded-full px-2 py-1 text-xs ${getOnlineStatus() ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-700"}`}
          >
            {getOnlineStatus() ? "Online" : "Offline"}
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-500">ID: {baseStation.id}</p>
      </div>
      <div className="rounded-b-md border-t bg-neutral-50 p-3 dark:bg-black">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Clock className="h-3 w-3" />
          <span>
            Last updated{" "}
            {formatDistanceToNow(new Date(baseStation.last_ping), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BaseStationCard;
