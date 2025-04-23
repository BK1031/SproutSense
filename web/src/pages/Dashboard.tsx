import Layout from "@/components/Layout";
import { CurrentWeatherCard } from "@/components/dashboard/CurrentWeatherCard";
import { CurrentBPSCard } from "@/components/dashboard/CurrentBPSCard";
import { Widget } from "@/components/dashboard/Widget";
import { Leaf } from "lucide-react";

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
          <Widget
            title="Current Weather"
            icon={Leaf}
            width="350px"
            height="200px"
          >
            <div className="h-full w-full bg-sky-300">300x200</div>
          </Widget>
          <Widget
            title="Current Weather"
            icon={Leaf}
            width="300px"
            height="500px"
          >
            <div className="h-full w-full bg-sky-300">300x500</div>
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
