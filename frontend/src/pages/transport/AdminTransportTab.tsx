import { useState, useEffect } from "react";
import axios from "axios";
import Card from "../../components/Card";
import { Button } from "../../components/ui/button";
import { Upload, Eye, Trash, Calendar, Bus, ChevronDown } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "../../context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  status: string;
  status_updated_at?: string;
}

interface Timetable {
  timetable_id: number;
  bus_id: number;
  image_path: string;
}

// ✅ Simplified Status Options
const STATUS_OPTIONS = [
  { label: "At Gate", value: "At Gate", color: "bg-green-500" },
  { label: "Left Gate", value: "Left Gate", color: "bg-yellow-500" },
  { label: "Delayed", value: "Delayed", color: "bg-orange-500" },
  { label: "Cancelled", value: "Cancelled", color: "bg-red-500" },
];

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

  /* ---------------------- FETCH DATA ---------------------- */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [busRes, timeRes] = await Promise.all([
          axios.get(`${API_BASE}/api/transport/bus/all`, getAuthHeaders()),
          axios.get(`${API_BASE}/api/transport/timetable/all`, getAuthHeaders()),
        ]);
        setBuses(busRes.data.data);
        setTimetables(timeRes.data.data);
      } catch {
        toast({ title: "Error loading data", variant: "destructive" });
      }
    };
    fetchAll();
  }, [refresh]);

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

  /* ---------------------- STATUS UPDATE ---------------------- */
  const handleStatusUpdate = async (bus_id: number, status: string) => {
    try {
      await axios.post(`${API_BASE}/api/transport/status/update`, { bus_id, status }, getAuthHeaders());
      toast({
        title: "🚍 Bus Status Updated",
        description: `${status} — notification sent to all students.`,
      });
      setRefresh(!refresh);
    } catch {
      toast({ title: "❌ Failed to Update Status", variant: "destructive" });
    }
  };

  /* ---------------------- UPLOAD TIMETABLE ---------------------- */
  const handleUpload = async () => {
    if (!file || !selectedBus) return toast({ title: "⚠️ Please select a file", variant: "destructive" });
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

  const deleteTimetable = async (timetable_id: number) => {
    if (!confirm("Delete this timetable?")) return;
    try {
      await axios.delete(`${API_BASE}/api/transport/timetable/${timetable_id}`, getAuthHeaders());
      toast({ title: "🗑 Timetable Deleted" });
      setOpenModal(false);
      setRefresh(!refresh);
    } catch {
      toast({ title: "❌ Failed to Delete Timetable", variant: "destructive" });
    }
  };

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
          <input
            name="stops"
            placeholder="Stops (comma-separated)"
            className="border p-2 rounded col-span-2"
            required
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
            const timetable = timetables.find((t) => t.bus_id === bus.bus_id);
            const imgSrc = timetable
              ? `${API_BASE}/${timetable.image_path.replace("src\\", "").replace("src/", "").replace(/\\/g, "/")}`
              : null;
            const currentStatus =
              STATUS_OPTIONS.find((s) => s.value === bus.status) || STATUS_OPTIONS[0];

            return (
              <Card key={bus.bus_id} className="p-4 border border-gray-200 shadow-sm rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{bus.bus_number} — {bus.route_name}</p>
                    <p className="text-sm text-muted-foreground">{bus.start_point} → {bus.end_point}</p>

                    {/* ✅ Updated Status Section */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`w-3 h-3 rounded-full ${currentStatus.color}`}></span>
                      <p className="text-xs text-gray-600">
                        Status: {bus.status || "Not Updated"}
                        {bus.status_updated_at && (
                          <span className="ml-1 text-gray-500">
                            — {new Date(bus.status_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          Change Status <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Select Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {STATUS_OPTIONS.map((opt) => (
                          <DropdownMenuItem
                            key={opt.value}
                            onClick={() => handleStatusUpdate(bus.bus_id, opt.value)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <span className={`w-3 h-3 rounded-full ${opt.color}`}></span>
                            {opt.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

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

                    <Button size="sm" variant="secondary" onClick={() => setEditingBusId(bus.bus_id)}>
                      ✏️ Edit
                    </Button>

                    <Button size="sm" className="bg-red-600 text-white" onClick={() => handleDeleteBus(bus.bus_id)}>
                      🗑 Delete
                    </Button>
                  </div>
                </div>

                {/* Edit Form */}
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
                    <div className="col-span-2 flex gap-3">
                      <Button type="submit" className="bg-green-600 text-white">
                        💾 Save
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setEditingBusId(null)}>
                        ✖ Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Timetable Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🗓 Manage Timetable — {selectedBus?.bus_number}</DialogTitle>
          </DialogHeader>

          {selectedBus && (
            <div className="space-y-4">
              {(() => {
                const timetable = timetables.find((t) => t.bus_id === selectedBus.bus_id);
                if (timetable) {
                  const imgSrc = `${API_BASE}/${timetable.image_path
                    .replace("src\\", "")
                    .replace("src/", "")
                    .replace(/\\/g, "/")}`;
                  return (
                    <div className="space-y-3 flex flex-col items-center">
                      <img
                        src={imgSrc}
                        alt="Timetable"
                        className="rounded-md border shadow-sm object-contain max-h-[300px] w-auto"
                      />
                      <div className="flex justify-center gap-3 mt-2 flex-wrap">
                        <Button
                          variant="secondary"
                          onClick={() => window.open(imgSrc, "_blank")}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" /> View Full
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => deleteTimetable(timetable.timetable_id)}
                          className="flex items-center gap-1"
                        >
                          <Trash className="w-4 h-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="border p-2 rounded w-full"
                    />
                    <Button
                      onClick={handleUpload}
                      disabled={loading}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      {loading ? "Uploading..." : <><Upload className="w-4 h-4 mr-1" /> Upload Timetable</>}
                    </Button>
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransportTab;
