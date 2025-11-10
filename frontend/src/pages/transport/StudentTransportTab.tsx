// frontend/src/pages/transport/StudentTransportTab.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import  io  from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/Card";
import { Button } from "../../components/ui/button";
import { Bus, Clock } from "lucide-react";

interface BusData {
  bus_id: number;
  bus_number: string;
  route_name: string;
  start_point: string;
  end_point: string;
  stops: string;
  status: string;
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
  const { currentUser } = useAuth();
  const [buses, setBuses] = useState<BusData[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const getImageUrl = (path: string) => {
    if (!path) return "";
    const normalized = path.replace(/\\/g, "/");
    return normalized.startsWith("uploads/")
      ? `${API_BASE}/${normalized}`
      : `${API_BASE}/uploads/${normalized}`;
  };

  /* ---------------------- FETCH INITIAL DATA ---------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [busRes, timeRes] = await Promise.all([
          axios.get(`${API_BASE}/api/transport/bus/all`),
          axios.get(`${API_BASE}/api/transport/timetable/all`),
        ]);
        setBuses(busRes.data.data);
        setTimetables(timeRes.data.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  /* ---------------------- REALTIME UPDATES ---------------------- */
  useEffect(() => {
    socket.on("connect", () => console.log("🟢 Connected to socket:", socket.id));

    socket.on("busStatusUpdated", (update: any) => {
      console.log("📡 Bus status update received:", update);
      setBuses((prev) =>
        prev.map((bus) =>
          bus.bus_id === update.bus_id
            ? { ...bus, status: update.status, status_updated_at: update.status_updated_at }
            : bus
        )
      );
    });

    return () => {
      socket.off("busStatusUpdated");
      socket.disconnect();
    };
  }, []);

  /* ---------------------- SHOW TIMETABLE ---------------------- */
  const handleBusClick = (bus_id: number) => {
    const busTimetables = timetables.filter((t) => t.bus_id === bus_id);
    if (busTimetables.length === 0) {
      alert("No timetable uploaded for this bus yet.");
      return;
    }
    const firstTimetable = busTimetables[0];
    const imgUrl = getImageUrl(firstTimetable.image_path);
    setPreviewImage(imgUrl);
  };

  /* ---------------------- RENDER ---------------------- */
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Bus className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Available Buses</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {buses.map((bus) => (
          <Card
            key={bus.bus_id}
            onClick={() => handleBusClick(bus.bus_id)}
            className="cursor-pointer hover:ring-2 hover:ring-primary transition p-4"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-foreground">
                  {bus.bus_number} — {bus.route_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {bus.start_point} → {bus.end_point}
                </p>
                <p className="text-xs text-muted-foreground">Stops: {bus.stops}</p>

                {/* 🚍 STATUS */}
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      bus.status === "At Gate"
                        ? "bg-green-500"
                        : bus.status === "Left Gate"
                        ? "bg-yellow-500"
                        : bus.status === "Delayed"
                        ? "bg-orange-500"
                        : bus.status === "Cancelled"
                        ? "bg-red-500"
                        : "bg-gray-400"
                    }`}
                  ></span>
                  <span className="font-medium">
                    {bus.status || "Status: Not Updated"}
                  </span>
                </div>

                {/* ⏰ TIME */}
                {bus.status_updated_at && (
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    Updated at{" "}
                    {new Date(bus.status_updated_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
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
