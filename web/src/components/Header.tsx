import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Moon, Sun, AlertCircle, X } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { useAlerts } from "@/hooks/useAlerts";
import { useNavigate } from "react-router-dom";
import { setFocusedSensorModuleId } from "@/lib/store";
import { useState } from "react";
import { format } from "date-fns";

interface HeaderProps {
  className?: string;
  headerTitle?: string;
  style?: React.CSSProperties;
  scroll: number;
}

const Header = ({ className, headerTitle, style, scroll }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { alerts, criticalAlerts, dismissAlerts, fetchSensorData, loading } =
    useAlerts();
  const [customDate, setCustomDate] = useState<Date | undefined>();
  const [customTime, setCustomTime] = useState<string>("12:00");
  const [snoozeConfirmation, setSnoozeConfirmation] = useState<number | null>(
    null,
  );
  const [activeCalendarSMID, setActiveCalendarSMID] = useState<number | null>(
    null,
  );
  const hasAlerts = alerts.length > 0 || criticalAlerts.length > 0;

  const uniqueSensorModuleIds = Array.from(
    new Set(
      alerts
        .map((msg) => {
          const match = msg.match(/SM (\d+)/);
          return match ? parseInt(match[1]) : null;
        })
        .filter((id): id is number => id !== null),
    ),
  );

  const uniqueCriticalModuleIds = Array.from(
    new Set(
      criticalAlerts
        .map((msg) => {
          const match = msg.match(/SM (\d+)/);
          return match ? parseInt(match[1]) : null;
        })
        .filter((id): id is number => id !== null),
    ),
  );

  return (
    <nav
      className={`duration-50 fixed top-0 z-20 w-full items-center justify-start transition-all ${
        scroll > 24 ? "bg-background shadow-lg" : "bg-background"
      } ${className}`}
      style={style}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center p-4">
          <h1 className="text-2xl font-bold">{headerTitle}</h1>
        </div>
        <div className="mr-4 flex flex-row items-center gap-4 p-4">
          <Popover onOpenChange={() => setActiveCalendarSMID(null)}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={
                  criticalAlerts.length > 0
                    ? "text-red-600 hover:text-red-700"
                    : alerts.length > 0
                      ? "text-yellow-500 hover:text-yellow-600"
                      : "text-muted-foreground hover:text-foreground"
                }
              >
                <AlertCircle className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">View alerts</span>
              </Button>
            </PopoverTrigger>

            <PopoverContent className="scrollbar-hide mr-2 max-h-[80vh] w-[330px] max-w-full overflow-y-auto p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Sensor Alerts</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground"
                  onClick={fetchSensorData}
                  disabled={loading}
                >
                  {loading ? "Checking..." : "Check"}
                </Button>
              </div>

              {hasAlerts ? (
                <>
                  {uniqueCriticalModuleIds.length > 0 && (
                    <>
                      <p className="mb-1 text-sm font-semibold text-red-700">
                        Critical Alerts
                      </p>
                      <ul className="mb-3 list-inside space-y-1 text-sm text-red-700 dark:text-red-400">
                        {uniqueCriticalModuleIds.map((smid) => (
                          <li key={`crit-${smid}`}>
                            <button
                              onClick={() => {
                                setFocusedSensorModuleId(smid);
                                navigate("/map");
                              }}
                              className="text-left underline hover:text-red-800"
                            >
                              Sensor Module {smid} - Critical condition detected
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {uniqueSensorModuleIds.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-yellow-600">
                        Warnings
                      </p>
                      <ul className="list-inside space-y-2 text-sm text-yellow-600 dark:text-yellow-400">
                        {uniqueSensorModuleIds.map((smid) => (
                          <li key={smid} className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => dismissAlerts(smid, 1)}
                                  >
                                    Snooze 1 min
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => dismissAlerts(smid, 60)}
                                  >
                                    Snooze 1 hour
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => dismissAlerts(smid, 1440)}
                                  >
                                    Snooze 1 day
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => dismissAlerts(smid, 2880)}
                                  >
                                    Snooze 2 days
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => dismissAlerts(smid, 4320)}
                                  >
                                    Snooze 3 days
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => dismissAlerts(smid, 10080)}
                                  >
                                    Snooze 1 week
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => dismissAlerts(smid, 20160)}
                                  >
                                    Snooze 2 weeks
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setActiveCalendarSMID(smid)}
                                  >
                                    Pick date & time...
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              <button
                                onClick={() => {
                                  setFocusedSensorModuleId(smid);
                                  navigate("/map");
                                }}
                                className="flex-1 text-left underline hover:text-red-800"
                              >
                                Sensor Module {smid} - View details
                              </button>
                            </div>

                            {activeCalendarSMID === smid && (
                              <div className="w-full min-w-[260px] rounded-md border border-gray-200 bg-background p-3 text-foreground shadow-sm">
                                <div className="mb-2 flex items-center justify-between">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-muted-foreground"
                                    onClick={() => setActiveCalendarSMID(null)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Calendar
                                  mode="single"
                                  selected={customDate}
                                  onSelect={setCustomDate}
                                  disabled={(date) => {
                                    const now = new Date();
                                    now.setHours(0, 0, 0, 0);
                                    return date < now;
                                  }}
                                />
                                <input
                                  type="time"
                                  className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                  value={customTime}
                                  onChange={(e) =>
                                    setCustomTime(e.target.value)
                                  }
                                />
                                <Button
                                  size="sm"
                                  className="mt-2 w-full"
                                  onClick={() => {
                                    if (!customDate) {
                                      alert("Please select a date.");
                                      return;
                                    }
                                    if (customDate && customTime) {
                                      const [hours, minutes] = customTime
                                        .split(":")
                                        .map(Number);
                                      const finalDate = new Date(customDate);
                                      finalDate.setHours(hours);
                                      finalDate.setMinutes(minutes);

                                      if (finalDate <= new Date()) {
                                        alert("Please select a future time.");
                                        return;
                                      }

                                      dismissAlerts(smid, undefined, finalDate);
                                      setSnoozeConfirmation(smid);
                                      setActiveCalendarSMID(null);
                                    }
                                  }}
                                >
                                  Snooze until{" "}
                                  {customDate && customTime
                                    ? `${format(customDate, "MMM d")} at ${customTime}`
                                    : "selected time"}
                                </Button>
                                {snoozeConfirmation === smid && (
                                  <p className="mt-1 text-center text-xs text-green-600">
                                    Snoozed until{" "}
                                    {format(new Date(customDate!), "PPP")} at{" "}
                                    {customTime}
                                  </p>
                                )}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No alerts at this time.
                </p>
              )}
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
      {scroll > 24 ? <Separator /> : null}
    </nav>
  );
};

export default Header;
