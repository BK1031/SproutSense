import Layout from "@/components/Layout";
import { CurrentWeatherCard } from "@/components/dashboard/CurrentWeatherCard";
import { CurrentBPSCard } from "@/components/dashboard/CurrentBPSCard";
import { CurrentNPKCard } from "@/components/dashboard/CurrentNPKCard";
import { CurrentSoilMoistureCard } from "@/components/dashboard/CurrentSoilMoistureCard";
import { CurrentLuxCard } from "@/components/dashboard/CurrentLuxCard";
import { AIRecommendationCard } from "@/components/dashboard/AiRecommendationCard";
import { Widget } from "@/components/dashboard/Widget";
import { Leaf, Droplets, Sun } from "lucide-react";

export default function Dashboard() {
  return (
    <>
      <Layout activeTab="dashboard" headerTitle="Dashboard">
        <div className="flex h-full w-full flex-wrap gap-4 overflow-auto p-8">
          <Widget
            title="Current Weather"
            icon={Leaf}
            width="300px"
            height="200px"
          >
            <CurrentWeatherCard />
          </Widget>
          <Widget
            title="Current Network Throughput"
            icon={Leaf}
            width="350px"
            height="200px"
          >
            <CurrentBPSCard />
          </Widget>
          <Widget title="Current NPK" icon={Leaf} width="300px" height="200px">
            <CurrentNPKCard />
          </Widget>
          <Widget
            title="Current Soil Moisture"
            icon={Droplets}
            width="300px"
            height="200px"
          >
            <CurrentSoilMoistureCard />
          </Widget>
          <Widget title="Current Lux" icon={Sun} width="300px" height="200px">
            <CurrentLuxCard />
          </Widget>
          <Widget
            title="AI Watering Recommendation"
            icon={Leaf}
            width="350px"
            height="250px"
          >
            <AIRecommendationCard />
          </Widget>
          <Widget
            title="Current Weather"
            icon={Leaf}
            width="615px"
            height="200px"
          >
            <div className="h-full w-full bg-sky-300">600x200</div>
          </Widget>
        </div>
      </Layout>
    </>
  );
}
