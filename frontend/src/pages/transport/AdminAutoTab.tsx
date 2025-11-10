import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/Card";
import { Button } from "../../components/ui/button";
import { CarFront, ChevronDown } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface AutoData {
  auto_id: number;
  auto_number: string;
  driver_name: string;
  phone_number: string;
  status: string;
}

const STATUS_OPTIONS = [
  { label: "At Gate", value: "At Gate", color: "bg-green-500" },
  { label: "Left Gate", value: "Left Gate", color: "bg-yellow-500" },
  { label: "Busy (Transporting Students)", value: "Busy", color: "bg-purple-500" },
  { label: "At Lunch", value: "At Lunch", color: "bg-orange-500" },
  { label: "Unavailable", value: "Unavailable", color: "bg-gray-400" },
];

const AdminAutoTab = () => {
  const { currentUser } = useAuth();
  const [autos, setAutos] = useState<AutoData[]>([]);
  const [editingAutoId, setEditingAutoId] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(false);

  const getAuthHeaders = () => ({
    headers: { "x-user-role": currentUser?.roles?.[0] || "super_admin" },
  });

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/transport/auto/all`, getAuthHeaders())
      .then((res) => setAutos(res.data.data))
      .catch((err) => {
        toast({
          title: "Error fetching autos",
          description: err.response?.data?.message || "Something went wrong.",
          variant: "destructive",
        });
      });
  }, [refresh]);

  /* ---------------------- ADD AUTO ---------------------- */
  const handleAddAuto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      auto_number: (form.auto_number as HTMLInputElement).value,
      driver_name: (form.driver_name as HTMLInputElement).value,
      phone_number: (form.phone_number as HTMLInputElement).value,
    };

    try {
      await axios.post(`${API_BASE}/api/transport/auto/add`, data, {
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.roles?.[0] || "super_admin",
        },
      });
      toast({
        title: "✅ Auto Added Successfully",
        description: `${data.auto_number} — ${data.driver_name}`,
      });
      form.reset();
      setRefresh(!refresh);
    } catch (err: any) {
      toast({
        title: "❌ Failed to Add Auto",
        description: err.response?.data?.message || "Internal Server Error",
        variant: "destructive",
      });
    }
  };

  /* ---------------------- UPDATE AUTO ---------------------- */
  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>, auto_id: number) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const updated = {
      auto_number: (form.auto_number as HTMLInputElement).value,
      driver_name: (form.driver_name as HTMLInputElement).value,
      phone_number: (form.phone_number as HTMLInputElement).value,
    };

    try {
      await axios.put(`${API_BASE}/api/transport/auto/update/${auto_id}`, updated, getAuthHeaders());
      toast({
        title: "✅ Auto Updated Successfully",
        description: `${updated.auto_number} — ${updated.driver_name}`,
      });
      setEditingAutoId(null);
      setRefresh(!refresh);
    } catch {
      toast({ title: "❌ Failed to Update Auto", variant: "destructive" });
    }
  };

  /* ---------------------- DELETE AUTO ---------------------- */
  const handleDeleteAuto = async (auto_id: number) => {
    if (!confirm("Delete this auto?")) return;
    try {
      await axios.delete(`${API_BASE}/api/transport/auto/${auto_id}`, getAuthHeaders());
      toast({
        title: "🗑 Auto Deleted",
        description: "The auto record was removed successfully.",
      });
      setRefresh(!refresh);
    } catch {
      toast({
        title: "❌ Failed to Delete Auto",
        variant: "destructive",
      });
    }
  };

  /* ---------------------- STATUS UPDATE ---------------------- */
  const handleStatusUpdate = async (auto_id: number, status: string) => {
    try {
      await axios.post(`${API_BASE}/api/transport/auto/status/update`, { auto_id, status }, getAuthHeaders());
      toast({
        title: "🚦 Auto Status Updated",
        description: `Marked as ${status}`,
      });
      setRefresh(!refresh);
    } catch {
      toast({
        title: "❌ Failed to Update Status",
        variant: "destructive",
      });
    }
  };

  /* ---------------------- RENDER ---------------------- */
  return (
    <div className="space-y-8">
      {/* Add Auto */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-3 text-primary flex items-center gap-2">
          <CarFront className="w-5 h-5 text-primary" /> Add New Auto
        </h3>
        <form onSubmit={handleAddAuto} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input name="auto_number" placeholder="Auto Number" className="border p-2 rounded" required />
          <input name="driver_name" placeholder="Driver Name" className="border p-2 rounded" required />
          <input name="phone_number" placeholder="Phone Number" className="border p-2 rounded" required />
          <Button type="submit" className="col-span-2 bg-primary text-white hover:bg-primary/90">
            ➕ Add Auto
          </Button>
        </form>
      </Card>

      {/* Auto List */}
      <section>
        <h3 className="text-lg font-semibold mb-3 text-primary">Autos</h3>
        <div className="space-y-4">
          {autos.map((auto) => {
            const currentStatus =
              STATUS_OPTIONS.find((s) => s.value === auto.status) || STATUS_OPTIONS[4]; // fallback to "Unavailable"

            return (
              <Card key={auto.auto_id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{auto.auto_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {auto.driver_name} — {auto.phone_number}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-3 h-3 rounded-full ${currentStatus.color}`}></span>
                      <p className="text-xs text-gray-600">Status: {auto.status || "Unavailable"}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    {/* ✅ Clean Dropdown Menu for Status Update */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 border-gray-400"
                        >
                          Change Status <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Select New Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {STATUS_OPTIONS.map((option) => (
                          <DropdownMenuItem
                            key={option.value}
                            onClick={() => handleStatusUpdate(auto.auto_id, option.value)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <span className={`w-3 h-3 rounded-full ${option.color}`}></span>
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button size="sm" variant="secondary" onClick={() => setEditingAutoId(auto.auto_id)}>
                      ✏️ Edit
                    </Button>
                    <Button size="sm" className="bg-red-600 text-white" onClick={() => handleDeleteAuto(auto.auto_id)}>
                      🗑 Delete
                    </Button>
                  </div>
                </div>

                {editingAutoId === auto.auto_id && (
                  <form
                    onSubmit={(e) => handleEditSave(e, auto.auto_id)}
                    className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded"
                  >
                    <input name="auto_number" defaultValue={auto.auto_number} className="border p-2 rounded" required />
                    <input name="driver_name" defaultValue={auto.driver_name} className="border p-2 rounded" required />
                    <input name="phone_number" defaultValue={auto.phone_number} className="border p-2 rounded" required />
                    <div className="col-span-2 flex gap-3">
                      <Button type="submit" className="bg-green-600 text-white">
                        💾 Save
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setEditingAutoId(null)}>
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
    </div>
  );
};

export default AdminAutoTab;
