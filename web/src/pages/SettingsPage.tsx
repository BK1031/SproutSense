import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import rawThresholds from "@/data/plant_thresholds.json";
import { usePlant } from "@/context/plantContext";

// 👇 Add this just after the JSON import
const plantThresholds = rawThresholds as Record<
  string,
  Record<string, { min: number; max: number }>
>;

export default function SettingsPage() {
  const { selectedPlant, setSelectedPlant } = usePlant();

  return (
    <Layout activeTab="settings" headerTitle="Settings">
      <div className="space-y-6 p-8 pb-14">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Plant Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              onValueChange={(value) => setSelectedPlant(value)}
              defaultValue={selectedPlant}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select plant" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(plantThresholds).map((plant) => (
                  <SelectItem key={plant} value={plant}>
                    {plant.charAt(0).toUpperCase() + plant.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
