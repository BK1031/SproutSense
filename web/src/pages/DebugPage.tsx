import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SystemLog, MqttLog } from "@/models/log";
import { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/consts/config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DebugPage() {
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [mqttLogs, setMqttLogs] = useState<MqttLog[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<number>(1);

  const fetchLogs = () => {
    axios.get(`${BACKEND_URL}/logs/system`).then((response) => {
      setSystemLogs(response.data);
    });
    axios.get(`${BACKEND_URL}/logs/mqtt`).then((response) => {
      setMqttLogs(response.data);
    });
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return (
    <Layout activeTab="debug" headerTitle="Debug">
      <div className="flex w-full flex-wrap gap-4 overflow-auto pb-14">
        <Card className="min-w-[400px] flex-1">
          <CardHeader>
            <CardTitle>System Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] overflow-clip">
              <div className="">
                {systemLogs.map((log) => (
                  <div
                    key={log.id.toString()}
                    className="py-1 font-mono text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400">
                        {new Date(log.created_at + "Z").toLocaleString()}
                      </span>
                    </div>
                    <code className="font-mono">{log.message}</code>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="min-w-[400px] flex-1">
          <CardHeader>
            <CardTitle>MQTT Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] overflow-clip">
              <div className="">
                {mqttLogs.map((log) => (
                  <div
                    key={log.id.toString()}
                    className="py-1 font-mono text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400">
                        {new Date(log.created_at + "Z").toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Card className="bg-green-500/50 px-1.5 py-0.5 text-white dark:text-primary">
                        {log.topic}
                      </Card>
                      <code className="font-mono">{log.message}</code>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <div className="fixed bottom-4 right-4">
          <Card className="flex items-center gap-2 p-2 px-4">
            <span className="text-md">Refresh every:</span>
            <Select
              value={refreshInterval.toString()}
              onValueChange={(value) => setRefreshInterval(Number(value))}
            >
              <SelectTrigger className="w-[125px]">
                <SelectValue placeholder="Refresh interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1" className="text-right">
                  1 second
                </SelectItem>
                <SelectItem value="5" className="text-right">
                  5 seconds
                </SelectItem>
                <SelectItem value="10" className="text-right">
                  10 seconds
                </SelectItem>
                <SelectItem value="30" className="text-right">
                  30 seconds
                </SelectItem>
              </SelectContent>
            </Select>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
