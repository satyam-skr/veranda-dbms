import { useState, useEffect } from "react";
import axios from "axios";
import Card from "../../components/Card";
import { Button } from "../../components/ui/button";
import {
  Bus,
  Clock,
  Calendar,
  ChevronDown,
  Trash,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "../../context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

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
  public_url?: string;
}

const AdminTransportTab = () => {
  const { currentUser } = useAuth();
  const [buses, setBuses] = useState<BusData[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [editingBusId, setEditingBusId] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const getAuthHeaders = () => ({
    headers: { "x-user-role": currentUser?.roles?.[0] || "super_admin" },
  });

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

  /* ---------------------- FETCH DATA ---------------------- */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [busRes, timeRes] = await Promise.all([
          axios.get(`${API_BASE}/api/transport/bus/all`, getAuthHeaders()),
          axios.get(`${API_BASE}/api/transport/timetable/all`, getAuthHeaders()),
        ]);
        setBuses(busRes.data.data || []);
        setTimetables(timeRes.data.data || []);
      } catch {
        toast({ title: "Error loading data", variant: "destructive" });
      }
    };
    fetchAll();
  }, [refresh]);

  /* ---------------------- STATUS UPDATE ---------------------- */
  const handleMarkArrived = async (bus_id: number) => {
    try {
      const res = await axios.post(`${API_BASE}/api/transport/bus/arrived`, { bus_id }, getAuthHeaders());
      const updatedBus: BusData = res.data?.data;
      if (updatedBus)
        setBuses((prev) => prev.map((b) => (b.bus_id === bus_id ? updatedBus : b)));
      toast({ title: "✅ Bus Marked as Arrived" });
    } catch {
      toast({ title: "❌ Failed to Mark as Arrived", variant: "destructive" });
    }
  };

  const handleMarkLeft = async (bus_id: number) => {
    try {
      const res = await axios.post(`${API_BASE}/api/transport/bus/reset`, { bus_id }, getAuthHeaders());
      const updatedBus: BusData = res.data?.data;
      if (updatedBus)
        setBuses((prev) => prev.map((b) => (b.bus_id === bus_id ? updatedBus : b)));
      toast({ title: "🟡 Bus Left" });
    } catch {
      toast({ title: "❌ Failed to Update Status", variant: "destructive" });
    }
  };

  /* ---------------------- ADD BUS ---------------------- */
  const handleAddBus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      bus_number: (form.bus_number as HTMLInputElement).value,
      route_name: (form.route_name as HTMLInputElement).value,
      start_point: (form.start_point as HTMLInputElement).value,
      end_point: (form.end_point as HTMLInputElement).value,
      stops: (form.stops as HTMLInputElement).value,
      tracking_url: (form.tracking_url as HTMLInputElement).value || null,
    };
    try {
      await axios.post(`${API_BASE}/api/transport/bus/add`, data, getAuthHeaders());
      toast({ title: "✅ Bus Added Successfully", description: `${data.bus_number}` });
      form.reset();
      setRefresh(!refresh);
    } catch {
      toast({ title: "❌ Failed to Add Bus", variant: "destructive" });
    }
  };

  /* ---------------------- UPDATE BUS ---------------------- */
  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>, bus_id: number) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const updated = {
      bus_number: (form.bus_number as HTMLInputElement).value,
      route_name: (form.route_name as HTMLInputElement).value,
      start_point: (form.start_point as HTMLInputElement).value,
      end_point: (form.end_point as HTMLInputElement).value,
      stops: (form.stops as HTMLInputElement).value,
      tracking_url: (form.tracking_url as HTMLInputElement).value || null,
    };
    try {
      await axios.put(`${API_BASE}/api/transport/bus/update/${bus_id}`, updated, getAuthHeaders());
      toast({ title: "✅ Bus Updated Successfully" });
      setEditingBusId(null);
      setRefresh(!refresh);
    } catch {
      toast({ title: "❌ Failed to Update Bus", variant: "destructive" });
    }
  };

  /* ---------------------- DELETE BUS ---------------------- */
  const handleDeleteBus = async (bus_id: number) => {
    if (!confirm("Delete this bus and its timetables?")) return;
    try {
      await axios.delete(`${API_BASE}/api/transport/bus/${bus_id}`, getAuthHeaders());
      toast({ title: "🗑 Bus Deleted" });
      setRefresh(!refresh);
    } catch {
      toast({ title: "❌ Failed to Delete Bus", variant: "destructive" });
    }
  };

  /* ---------------------- TIMETABLE UPLOAD / DELETE ---------------------- */
  const handleUpload = async () => {
    if (!file || !selectedBus)
      return toast({ title: "⚠️ Please select a file", variant: "destructive" });

    const formData = new FormData();
    formData.append("bus_id", selectedBus.bus_id.toString());
    formData.append("timetableImage", file);
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/transport/timetable/upload`, formData, getAuthHeaders());
      toast({ title: "📅 Timetable Uploaded Successfully" });
      setFile(null);
      setOpenModal(false);
      setRefresh(!refresh);
    } catch {
      toast({ title: "❌ Upload Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimetable = async (timetable_id: number) => {
    if (!confirm("Are you sure you want to delete this timetable?")) return;
    try {
      await axios.delete(`${API_BASE}/api/transport/timetable/${timetable_id}`, getAuthHeaders());
      toast({ title: "🗑 Timetable Deleted" });
      setOpenModal(false);
      setRefresh(!refresh);
    } catch {
      toast({ title: "❌ Failed to Delete Timetable", variant: "destructive" });
    }
  };

  const getBusTimetable = (bus_id: number) =>
    timetables.find((t) => t.bus_id === bus_id);

  /* ---------------------- RENDER ---------------------- */
  return (
    <div className="space-y-8">
      {/* Add Bus */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-3 text-primary flex items-center gap-2">
          <Bus className="w-5 h-5 text-primary" /> Add New Bus
        </h3>
        <form onSubmit={handleAddBus} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input name="bus_number" placeholder="Bus Number" className="border p-2 rounded" required />
          <input name="route_name" placeholder="Route Name" className="border p-2 rounded" required />
          <input name="start_point" placeholder="Start Point" className="border p-2 rounded" required />
          <input name="end_point" placeholder="End Point" className="border p-2 rounded" required />
          <input name="stops" placeholder="Stops (comma-separated)" className="border p-2 rounded col-span-2" required />
          <input
            name="tracking_url"
            placeholder="Tracking URL (optional)"
            className="border p-2 rounded col-span-2"
          />
          <Button type="submit" className="col-span-2 bg-primary text-white hover:bg-primary/90">
            ➕ Add Bus
          </Button>
        </form>
      </Card>

      {/* Bus List */}
      <section>
        <h3 className="text-lg font-semibold mb-3 text-primary">Buses</h3>
        <div className="space-y-4">
          {buses.map((bus) => {
            const timetable = getBusTimetable(bus.bus_id);
            return (
              <Card key={bus.bus_id} className="p-4 border border-gray-200 shadow-sm rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{bus.bus_number} — {bus.route_name}</p>
                    <p className="text-sm text-muted-foreground">{bus.start_point} → {bus.end_point}</p>
                    <p className="text-xs text-muted-foreground">Stops: {bus.stops}</p>

                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      Last Updated: {formatDateTime(bus.status_updated_at)}
                    </div>

                    <div
                      className={`font-medium mt-1 ${
                        bus.has_arrived ? "text-green-600" : "text-yellow-600"
                      }`}
                    >
                      Status: {bus.has_arrived ? "Arrived" : "Bus Left"}
                    </div>

                    {bus.tracking_url ? (
                      <a
                        href={bus.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-xs mt-1 underline block"
                      >
                        Track Live ↗
                      </a>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1 italic">No tracking link added</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    {/* 🔽 Status Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" className="bg-green-700 text-white flex items-center gap-1">
                          <ChevronDown className="w-4 h-4" /> Update Status
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleMarkArrived(bus.bus_id)}>
                          🟢 Bus Arrived
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarkLeft(bus.bus_id)}>
                          🟡 Bus Left
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* ✏️ Edit */}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingBusId(bus.bus_id)}
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </Button>

                    {/* Timetable */}
                    <Button
                      size="sm"
                      className="bg-indigo-600 text-white flex items-center gap-1"
                      onClick={() => {
                        setSelectedBus(bus);
                        setOpenModal(true);
                      }}
                    >
                      <Calendar className="w-4 h-4" /> Timetable
                    </Button>

                    {/* Delete */}
                    <Button
                      size="sm"
                      className="bg-red-600 text-white"
                      onClick={() => handleDeleteBus(bus.bus_id)}
                    >
                      <Trash className="w-4 h-4" /> Delete
                    </Button>
                  </div>
                </div>

                {/* ✏️ Edit Form */}
                {editingBusId === bus.bus_id && (
                  <form
                    onSubmit={(e) => handleEditSave(e, bus.bus_id)}
                    className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded"
                  >
                    <input name="bus_number" defaultValue={bus.bus_number} className="border p-2 rounded" required />
                    <input name="route_name" defaultValue={bus.route_name} className="border p-2 rounded" required />
                    <input name="start_point" defaultValue={bus.start_point} className="border p-2 rounded" required />
                    <input name="end_point" defaultValue={bus.end_point} className="border p-2 rounded" required />
                    <input name="stops" defaultValue={bus.stops} className="border p-2 rounded col-span-2" required />
                    <input
                      name="tracking_url"
                      defaultValue={bus.tracking_url || ""}
                      placeholder="Tracking URL (optional)"
                      className="border p-2 rounded col-span-2"
                    />
                    <div className="col-span-2 flex gap-3">
                      <Button type="submit" className="bg-green-600 text-white">💾 Save</Button>
                      <Button type="button" variant="secondary" onClick={() => setEditingBusId(null)}>✖ Cancel</Button>
                    </div>
                  </form>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* 📅 Timetable Upload / Preview Modal */}
      {openModal && selectedBus && (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Timetable for {selectedBus.bus_number}</DialogTitle>
            </DialogHeader>

            {(() => {
              const existing = getBusTimetable(selectedBus.bus_id);
              if (existing) {
                const imageUrl = existing.public_url || `${API_BASE}/${existing.image_path}`;
                return (
                  <div className="space-y-3 text-center">
                    <img
                      src={imageUrl}
                      alt="Timetable"
                      className="max-h-[400px] mx-auto rounded-md shadow-md cursor-pointer"
                      onClick={() => window.open(imageUrl, "_blank")}
                    />
                    <div className="flex justify-center gap-3">
                      <Button
                        onClick={() => window.open(imageUrl, "_blank")}
                        className="bg-blue-600 text-white flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" /> Open in New Tab
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteTimetable(existing.timetable_id)}
                      >
                        🗑 Delete Timetable
                      </Button>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="border p-2 rounded w-full"
                    />
                    <DialogFooter>
                      <Button onClick={handleUpload} disabled={loading}>
                        {loading ? "Uploading..." : "Upload"}
                      </Button>
                    </DialogFooter>
                  </div>
                );
              }
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminTransportTab;
