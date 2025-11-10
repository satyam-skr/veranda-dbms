import { useState, useEffect } from "react";
import axios from "axios";
import Card from "../../components/Card";
import { Button } from "../../components/ui/button";
import { Upload } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

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

const AdminTransportTab = () => {
  const [buses, setBuses] = useState<BusData[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedBus, setSelectedBus] = useState<number | null>(null);
  const [editingBusId, setEditingBusId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/api/transport/bus/all`).then((res) => setBuses(res.data.data));
    axios.get(`${API_BASE}/api/transport/timetable/all`).then((res) => setTimetables(res.data.data));
  }, [refresh]);

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
    await axios.post(`${API_BASE}/api/transport/bus/add`, data);
    alert("Bus added successfully!");
    form.reset();
    setRefresh(!refresh);
  };

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
    await axios.put(`${API_BASE}/api/transport/bus/update/${bus_id}`, updated);
    alert("Bus updated successfully!");
    setEditingBusId(null);
    setRefresh(!refresh);
  };

  const handleDeleteBus = async (bus_id: number) => {
    if (!confirm("Delete this bus and its timetables?")) return;
    await axios.delete(`${API_BASE}/api/transport/bus/${bus_id}`);
    alert("Bus deleted successfully!");
    setRefresh(!refresh);
  };

  const markArrived = async (bus_id: number) => {
    await axios.post(`${API_BASE}/api/transport/bus/arrived`, { bus_id });
    alert("Bus marked as arrived");
  };

  const handleUpload = async () => {
    if (!file || !selectedBus) return alert("Select a bus and a file first.");
    const formData = new FormData();
    formData.append("bus_id", selectedBus.toString());
    formData.append("timetableImage", file);
    setLoading(true);
    await axios.post(`${API_BASE}/api/transport/timetable/upload`, formData);
    setLoading(false);
    alert("Timetable uploaded successfully!");
    setFile(null);
    setRefresh(!refresh);
  };

  const deleteTimetable = async (id: number) => {
    if (!confirm("Delete this timetable?")) return;
    await axios.delete(`${API_BASE}/api/transport/timetable/${id}`);
    setRefresh(!refresh);
  };

  return (
    <div className="space-y-8">
      {/* Add Bus */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-3 text-primary">Add New Bus</h3>
        <form onSubmit={handleAddBus} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input name="bus_number" placeholder="Bus Number" className="border p-2 rounded" required />
          <input name="route_name" placeholder="Route Name" className="border p-2 rounded" required />
          <input name="start_point" placeholder="Start Point" className="border p-2 rounded" required />
          <input name="end_point" placeholder="End Point" className="border p-2 rounded" required />
          <input name="stops" placeholder="Stops (comma-separated)" className="border p-2 rounded col-span-2" required />
          <Button type="submit" className="col-span-2 bg-primary text-white hover:bg-primary/90">➕ Add Bus</Button>
        </form>
      </Card>

      {/* Bus List */}
      <section>
        <h3 className="text-lg font-semibold mb-3 text-primary">Buses</h3>
        <div className="space-y-4">
          {buses.map((bus) => (
            <Card key={bus.bus_id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-foreground">
                    {bus.bus_number} — {bus.route_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{bus.start_point} → {bus.end_point}</p>
                  <p className="text-xs text-muted-foreground">Stops: {bus.stops}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => markArrived(bus.bus_id)} size="sm" className="bg-green-600 text-white">Mark Arrived</Button>
                  <Button onClick={() => setEditingBusId(bus.bus_id)} size="sm" variant="secondary">✏️ Edit</Button>
                  <Button onClick={() => handleDeleteBus(bus.bus_id)} size="sm" className="bg-red-600 text-white">🗑 Delete</Button>
                </div>
              </div>

              {editingBusId === bus.bus_id && (
                <form onSubmit={(e) => handleEditSave(e, bus.bus_id)} className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded">
                  <input name="bus_number" defaultValue={bus.bus_number} className="border p-2 rounded" required />
                  <input name="route_name" defaultValue={bus.route_name} className="border p-2 rounded" required />
                  <input name="start_point" defaultValue={bus.start_point} className="border p-2 rounded" required />
                  <input name="end_point" defaultValue={bus.end_point} className="border p-2 rounded" required />
                  <input name="stops" defaultValue={bus.stops} className="border p-2 rounded col-span-2" required />
                  <div className="col-span-2 flex gap-3">
                    <Button type="submit" className="bg-green-600 text-white">💾 Save</Button>
                    <Button type="button" variant="secondary" onClick={() => setEditingBusId(null)}>✖ Cancel</Button>
                  </div>
                </form>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Upload Timetable */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-3 text-primary flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" /> Upload Timetable
        </h3>
        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={selectedBus ?? ""}
            onChange={(e) => setSelectedBus(Number(e.target.value))}
            className="border p-2 rounded w-full md:w-1/3"
          >
            <option value="">Select Bus</option>
            {buses.map((bus) => (
              <option key={bus.bus_id} value={bus.bus_id}>
                {bus.bus_number} - {bus.route_name}
              </option>
            ))}
          </select>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border p-2 rounded w-full md:w-1/3" />
          <Button onClick={handleUpload} disabled={loading} className="bg-primary text-white hover:bg-primary/90">
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </Card>

      {/* All Timetables */}
      <section>
        <h3 className="text-lg font-semibold mb-3 text-primary">All Uploaded Timetables</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {timetables.map((t) => {
            const imgSrc = `${API_BASE}/${t.image_path.replace("src\\", "").replace("src/", "").replace(/\\/g, "/")}`;
            return (
              <Card key={t.timetable_id} className="p-2 relative">
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 text-xs px-2 py-1"
                  onClick={() => deleteTimetable(t.timetable_id)}
                >
                  ✕
                </Button>
                <img src={imgSrc} alt="Timetable" className="rounded w-full h-auto object-cover" />
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default AdminTransportTab;
