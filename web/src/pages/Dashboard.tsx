import Layout from "@/components/Layout";
import { CurrentWeatherCard } from "@/components/dashboard/CurrentWeatherCard";
import { CurrentBPSCard } from "@/components/dashboard/CurrentBPSCard";
import { CurrentNPKCard } from "@/components/dashboard/CurrentNPKCard";
import { Widget } from "@/components/dashboard/Widget";
import { Leaf } from "lucide-react";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import axios from "axios";
import {
  BACKEND_URL,
  OPENWEATHER_API_KEY,
} from "@/consts/config";
import { useState } from "react";


export default function Dashboard() {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const fetchPrediction = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/ai/predict`, {
        moisture: 600,
        temp: 25,
        latitude: 34.0522,
        longitude: -118.2437,
        api_key: OPENWEATHER_API_KEY, // store this securely in production
      });
  
      const data = response.data;
      console.log("Prediction result:", data);
      setRecommendation(data.recommendation); // Update state to show in widget
    } catch (error) {
      const errorMessage = getAxiosErrorMessage(error);
      console.error("Error fetching prediction:", errorMessage);
      setRecommendation("Error fetching prediction: " + errorMessage);
    }
  };
  
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
            title="Current Weather"
            icon={Leaf}
            width="350px"
            height="200px"
          >
            <div className="h-full w-full bg-sky-300">300x200</div>
          </Widget>
          <Widget
            title="AI Watering Recommendation"
            icon={Leaf}
            width="300px"
            height="200px"
          >
            <div className="flex h-full w-full flex-col items-center justify-center gap-2">
              <button
                onClick={fetchPrediction}
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Get Recommendation
              </button>
              {recommendation && (
                <p className="mt-2 text-center text-lg font-semibold">{recommendation}</p>
              )}
            </div>
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
