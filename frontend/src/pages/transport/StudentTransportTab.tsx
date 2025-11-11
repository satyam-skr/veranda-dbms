import { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/Card";
import { Button } from "../../components/ui/button";
import { Bus, Clock, RotateCw, MapPin, Eye } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

interface BusData {
  bus_id: number;
  bus_number: string;
  route_name: string;
  start_point: string;
  end_point: string;
  stops: string;
  tracking_url?: string;
  has_arrived?: boolean;
  status_updated_at?: string;
}

interface Timetable {
  timetable_id: number;
  bus_id: number;
  image_path: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const socket = io(API_BASE, { transports: ["websocket"] });

const StudentTransportTab = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [buses, setBuses] = useState<BusData[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Helper: format date-time nicely
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

  const getImageUrl = (path: string) => {
    if (!path) return "";
    const normalized = path.replace(/\\/g, "/");
    return normalized.startsWith("uploads/")
      ? `${API_BASE}/${normalized}`
      : `${API_BASE}/uploads/${normalized}`;
  };

  /* ---------------------- FETCH BUS DATA ---------------------- */
  const fetchData = async (showToast = false) => {
    try {
      setLoading(true);
      const [busRes, timeRes] = await Promise.all([
        axios.get(`${API_BASE}/api/transport/bus/all`),
        axios.get(`${API_BASE}/api/transport/timetable/all`),
      ]);
      setBuses(busRes.data.data || []);
      setTimetables(timeRes.data.data || []);

      if (showToast) {
        toast({
          title: "Bus list refreshed",
          description: "Latest data loaded successfully.",
        });
      }
    } catch (err) {
      console.error("❌ Error fetching bus data:", err);
      toast({
        title: "Failed to load buses",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------------------- REALTIME UPDATES ---------------------- */
  useEffect(() => {
    socket.on("connect", () => console.log("🟢 Connected to socket:", socket.id));

    socket.on("busStatusUpdated", (update: any) => {
      console.log("📡 Bus update received:", update);
      setBuses((prev) =>
        prev.map((bus) =>
          bus.bus_id === update.bus_id
            ? {
                ...bus,
                has_arrived: update.has_arrived,
                status_updated_at: update.status_updated_at,
              }
            : bus
        )
      );
    });

    return () => {
      socket.off("busStatusUpdated");
      socket.disconnect();
    };
  }, []);

  /* ---------------------- HANDLE VIEW TIMETABLE ---------------------- */
  const handleViewTimetable = (bus_id: number) => {
    const busTimetables = timetables.filter((t) => t.bus_id === bus_id);
    if (busTimetables.length === 0) {
      toast({
        title: "No timetable available",
        description: "No timetable uploaded for this bus yet.",
      });
      return;
    }
    const imgUrl = getImageUrl(busTimetables[0].image_path);
    setPreviewImage(imgUrl);
  };

  /* ---------------------- RENDER ---------------------- */
  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bus className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Available Buses</h2>
        </div>

        <button
          onClick={() => fetchData(true)}
          title="Refresh Bus List"
          className={`flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-transform duration-300 ${
            loading ? "animate-spin" : ""
          }`}
          disabled={loading}
        >
          <RotateCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Bus List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {buses.length === 0 ? (
          <p className="text-gray-500 text-sm text-center">No buses available.</p>
        ) : (
          buses.map((bus) => (
            <Card
              key={bus.bus_id}
              className="p-4 hover:ring-2 hover:ring-primary transition cursor-default"
            >
              <div className="flex justify-between items-start">
                {/* Left section */}
                <div>
                  <p className="font-semibold text-foreground">
                    {bus.bus_number} — {bus.route_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bus.start_point} → {bus.end_point}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stops: {bus.stops}
                  </p>

                  {/* ✅ Live Tracking Button */}
                  {bus.tracking_url ? (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(bus.tracking_url, "_blank", "noopener,noreferrer");
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs mt-2 flex items-center gap-1"
                    >
                      <MapPin className="w-4 h-4" /> Track Live
                    </Button>
                  ) : (
                    <p className="text-xs text-gray-400 mt-2 italic">
                      Tracking link not available
                    </p>
                  )}
                </div>

                {/* Right section - Status + Time + View Button */}
                <div className="text-right text-xs text-gray-600">
                  <div
                    className={`font-medium ${
                      bus.has_arrived ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    Status: {bus.has_arrived ? "Arrived" : "Bus Left"}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(bus.status_updated_at)}</span>
                  </div>

                  {/* 👁️ View Timetable Icon */}
                  <button
                    title="View Timetable"
                    onClick={() => handleViewTimetable(bus.bus_id)}
                    className="flex items-center justify-end gap-1 text-blue-600 hover:text-blue-800 mt-2 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Timetable</span>
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 🖼 Timetable Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative">
            <img
              src={previewImage}
              alt="Bus Timetable"
              className="max-w-full max-h-[90vh] rounded-lg shadow-lg"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 rounded-full px-3 py-1"
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTransportTab;

