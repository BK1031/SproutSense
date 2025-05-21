import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";

export function ThresholdAlertCard() {
  const { alerts, loading, fetchSensorData } = useAlerts();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {alerts.length > 0 ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          Sensor Alerts
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Loading sensor data...
          </p>
        ) : alerts.length > 0 ? (
          <>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Alerts:
            </p>
            <ul className="list-inside list-disc text-sm text-red-600 dark:text-red-400">
              {alerts.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            ✅ No alerts triggered (or all sensors in range)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
