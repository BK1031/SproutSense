import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Moon, Sun, AlertCircle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAlerts } from "@/hooks/useAlerts";
import { useNavigate } from "react-router-dom";
import { setFocusedSensorModuleId } from "@/lib/store";

interface HeaderProps {
  className?: string;
  headerTitle?: string;
  style?: React.CSSProperties;
  scroll: number;
}

const Header = (props: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { alerts, dismissAlerts, fetchSensorData, loading } = useAlerts();
  //const [showAlerts, setShowAlerts] = useState(true);

  const hasAlerts = alerts.length > 0 //&& showAlerts;

  return (
    <nav
      className={`duration-50 fixed top-0 z-20 w-full items-center justify-start transition-all ${props.scroll > 24 ? "bg-background shadow-lg" : "bg-background"} ${props.className}`}
      style={{ ...props.style }}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center p-4">
          <h1 className="text-2xl font-bold">{props.headerTitle}</h1>
        </div>
        <div className="mr-4 flex flex-row items-center gap-4 p-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={hasAlerts ? "text-red-600 hover:text-red-700" : "text-muted-foreground hover:text-foreground"}
            >
              <AlertCircle className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">View alerts</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-3">
            <div className="flex justify-between items-center mb-2">
              <p className={`text-sm font-semibold ${hasAlerts ? "text-red-600" : "text-muted-foreground"}`}>
                Sensor Alerts
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground"
                onClick={fetchSensorData}
                disabled={loading}
              >
                {loading ? "Checking..." : "Check Alerts"}
              </Button>
            </div>

            {hasAlerts ? (
              <>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-600 dark:text-red-400">
                {(() => {
                  const seen = new Set<number>();
                  return alerts.map((alert, idx) => {
                    const match = alert.match(/SM (\d+)/);
                    const smid = match ? parseInt(match[1]) : null;

                    if (!smid || seen.has(smid)) return null;
                    seen.add(smid);

                    return (
                      <li key={idx}>
                        <button
                          onClick={() => {
                            setFocusedSensorModuleId(smid);
                            navigate("/map");
                          }}
                          className="underline text-left hover:text-red-800"
                        >
                          Problem on Sensor Module {smid}
                        </button>
                      </li>
                    );
                  });
                })()}
                </ul>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 text-xs text-muted-foreground"
                  onClick={dismissAlerts}
                >
                  Dismiss Alerts
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No alerts at this time.</p>
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
      {props.scroll > 24 ? <Separator /> : null}
    </nav>
  );
};

export default Header;