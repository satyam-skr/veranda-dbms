// frontend/src/pages/transport/StudentTransportTab.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/Card";
import { Button } from "../../components/ui/button";
import { Bus } from "lucide-react";

interface BusData {
  bus_id: number;
  bus_number: string;
  route_name: string;
  start_point: string;
  end_point: string;
  stops: string;
  has_arrived: boolean;
}

interface Timetable {
  timetable_id: number;
  bus_id: number;
  image_path: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const StudentTransportTab = () => {
  const { currentUser } = useAuth();
  const [buses, setBuses] = useState<BusData[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(false);

  const getImageUrl = (path: string) => {
  if (!path) return "";
  const normalized = path.replace(/\\/g, "/");

  // If path already includes "uploads/", don't prepend anything
  if (normalized.startsWith("uploads/")) {
    return `${API_BASE}/${normalized}`;
  }

  // Otherwise fallback
  return `${API_BASE}/uploads/${normalized}`;
};

  useEffect(() => {
    axios.get(`${API_BASE}/api/transport/bus/all`).then((res) => setBuses(res.data.data));
    axios.get(`${API_BASE}/api/transport/timetable/all`).then((res) => setTimetables(res.data.data));
  }, [refresh]);

  // ✅ On bus click, show first timetable in modal
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
            className="cursor-pointer hover:ring-2 hover:ring-primary transition"
          >
            <p className="font-semibold text-foreground">
              {bus.bus_number} — {bus.route_name}
            </p>
            <p className="text-sm text-muted-foreground">
              {bus.start_point} → {bus.end_point}
            </p>
            <p className="text-xs text-muted-foreground">Stops: {bus.stops}</p>
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
