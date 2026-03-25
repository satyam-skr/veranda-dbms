import { useState, useEffect } from "react";
import axios from "axios";
import Card from "../../components/Card";
import { CarFront, Clock, RotateCw } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const StudentAutoTab = () => {
  const { toast } = useToast();
  const [autos, setAutos] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAutos = async (showToast = false) => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE}/api/transport/auto/all`);
      setAutos(res.data.data || []);

      if (showToast) {
        toast({
          title: "Auto status refreshed",
          description: "Auto list updated successfully.",
        });
      }
    } catch (err) {
      console.error("❌ Error fetching autos:", err);
      if (showToast) {
        toast({
          title: "Failed to refresh autos",
          description: "Could not update auto list. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutos();

    const interval = setInterval(() => setRefresh((r) => !r), 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "Just now";

    let formatted = timestamp.trim();
    if (formatted.includes(" ")) {
      formatted = formatted.replace(" ", "T");
    }

    if (!formatted.endsWith("Z")) {
      formatted += "Z";
    }

    const utcDate = new Date(formatted);
    if (isNaN(utcDate.getTime())) return "Invalid date";

    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(utcDate.getTime() + istOffsetMs);

    const time = istDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const day = istDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return `${time} · ${day}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CarFront className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Available Autos</h2>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => fetchAutos(true)}
          title="Refresh Autos"
          className={`flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-transform duration-300 ${
            loading ? "animate-spin" : ""
          }`}
          disabled={loading}
        >
          <RotateCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {autos.length === 0 ? (
        <p className="text-gray-500 text-sm text-center">
          No autos available right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {autos.map((auto) => (
            <Card
              key={auto.auto_id}
              className="p-4 flex flex-col justify-between shadow-sm rounded-xl border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-foreground text-base">
                    {auto.auto_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {auto.driver_name} — {auto.phone_number}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={`font-semibold text-sm ${
                      auto.status === "At Gate"
                        ? "text-green-600"
                        : auto.status === "Left Gate"
                        ? "text-yellow-600"
                        : "text-gray-500"
                    }`}
                  >
                    {auto.status || "Unavailable"}
                  </p>

                  <div className="flex items-center justify-end gap-1 text-gray-500 text-xs mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(auto.status_updated_at)}</span>
                  </div>
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
