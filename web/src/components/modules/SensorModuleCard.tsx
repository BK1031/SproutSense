import {
  ArrowDownCircle,
  ArrowUpCircle,
  LocateFixed,
  LocateOff,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Leaf } from "lucide-react";
import { SensorModule } from "@/models/sensor-module";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

const SensorModuleCard = ({ module }: { module: SensorModule }) => {
  const getOnlineStatus = () => {
    const lastPingTime = new Date(module.last_ping + "Z").getTime();
    const currentTime = new Date().getTime();
    const hourInMilliseconds = 60 * 60 * 1000;
    const timeDiff = currentTime - lastPingTime;
    return timeDiff <= hourInMilliseconds;
  };

  return (
    <Card>
      <div className="flex p-4">
        <div className="flex-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Leaf
              className={`h-5 w-5 ${getOnlineStatus() ? "text-green-500" : "text-neutral-400"}`}
            />
          </div>
          <div className="flex flex-col items-start justify-center">
            <span className="font-medium">{module.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">ID: {module.id}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-2">
                    {getOnlineStatus() ? (
                      <ArrowUpCircle className="ml-2 h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="ml-2 h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm text-neutral-400">
                      Last seen{" "}
                      {formatDistanceToNow(new Date(module.last_ping + "Z"), {
                        addSuffix: true,
                      })}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Module last pinged{" "}
                      {new Date(module.last_ping + "Z").toLocaleString()}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col flex-wrap items-end justify-start gap-2">
          {module.latitude != 0 && module.longitude != 0 ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Card className="w-min border-none bg-green-500 px-[6px] py-[3px] text-center dark:bg-green-500/60">
                    <div className="flex items-center gap-1">
                      <LocateFixed className="h-4 w-4 text-white" />
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">GPS location active</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Card className="w-min border-none bg-yellow-500 px-[6px] py-[3px] text-center dark:bg-yellow-500/60">
                    <div className="flex items-center gap-1">
                      <LocateOff className="h-4 w-4 text-white" />
                      <span className="text-xs text-white">Unavailable</span>
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">GPS location unavailable</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </Card>
  );
};

export default SensorModuleCard;
