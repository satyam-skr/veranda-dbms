import { useState, useEffect } from "react";
import axios from "axios";
import Card from "../../components/Card";
import { CarFront, Clock } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface AutoData {
  auto_id: number;
  auto_number: string;
  driver_name: string;
  phone_number: string;
  status: string;
  status_updated_at?: string; // ✅ optional timestamp from backend
}

const StudentAutoTab = () => {
  const [autos, setAutos] = useState<AutoData[]>([]);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const fetchAutos = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/transport/auto/all`);
        setAutos(res.data.data || []);
      } catch (err) {
        console.error("❌ Error fetching autos:", err);
      }
    };

    fetchAutos();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => setRefresh((r) => !r), 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  // ✅ Helper: Format timestamp with time + date
  const formatDateTime = (timestamp?: string) => {
    if (!timestamp) return "Just now";

    const date = new Date(timestamp);
    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const day = date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return `${time} · ${day}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <CarFront className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Available Autos</h2>
      </div>

      {autos.length === 0 ? (
        <p className="text-gray-500 text-sm text-center">
          No autos available right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {autos.map((auto) => (
            <Card key={auto.auto_id} className="p-4">
              <p className="font-semibold text-foreground">{auto.auto_number}</p>
              <p className="text-sm text-muted-foreground">
                {auto.driver_name} — {auto.phone_number}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1 text-xs">
                <span
                  className={`font-medium ${
                    auto.status === "At Gate"
                      ? "text-green-600"
                      : auto.status === "Left Gate"
                      ? "text-yellow-600"
                      : "text-gray-500"
                  }`}
                >
                  Status: {auto.status || "Unavailable"}
                </span>

                <div className="flex items-center text-gray-500 gap-1 mt-1 sm:mt-0">
                  <Clock className="w-3 h-3" />
                  <span>{formatDateTime(auto.status_updated_at)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAutoTab;
