import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { LogOut, ArrowLeft, Bus, Car } from "lucide-react";
import AdminTransportTab from "./AdminTransportTab";
import StudentTransportTab from "./StudentTransportTab";
import AdminAutoTab from "./AdminAutoTab";
import StudentAutoTab from "./StudentAutoTab";
import { useState } from "react";

const TransportPage = () => {
  const { currentUser, hasRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = hasRole("super_admin");

  // State for tab selection
  const [activeTab, setActiveTab] = useState("bus"); // "bus" or "auto"

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">

          {/* Left: Back + Veranda */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <Link
              to="/"
              className="text-2xl font-bold text-primary hover:opacity-80"
            >
              Veranda
            </Link>
          </div>

          {/* Middle Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm text-foreground">
            <Link to="/olx" className="hover:text-primary transition">OLX</Link>
            <Link to="/mess" className="hover:text-primary transition">Mess</Link>

            <Link
              to="/transport"
              className={`hover:text-primary transition ${
                location.pathname.includes("transport")
                  ? "text-primary font-medium"
                  : ""
              }`}
            >
              Transport
            </Link>

            <Link to="/shop" className="hover:text-primary transition">
              Shop (Poll)
            </Link>

            <Link to="/complaint" className="hover:text-primary transition">
              General Complaint
            </Link>
          </nav>

          {/* Right: Role + Logout */}
          <div className="flex items-center gap-3">
            <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
              {currentUser?.roles?.[0] || "Student"}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="flex items-center gap-1 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-8 bg-gray-50 min-h-[90vh]">

        {/* Title Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bus className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Transport Management</h2>
          </div>

          {/* Tabs — Bus | Auto */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === "bus" ? "default" : "outline"}
              className={`flex items-center gap-1 ${
                activeTab === "bus"
                  ? "bg-primary text-white"
                  : "hover:bg-primary/10 text-primary"
              }`}
              onClick={() => setActiveTab("bus")}
            >
              <Bus className="w-4 h-4" />
              Bus
            </Button>

            <Button
              variant={activeTab === "auto" ? "default" : "outline"}
              className={`flex items-center gap-1 ${
                activeTab === "auto"
                  ? "bg-primary text-white"
                  : "hover:bg-primary/10 text-primary"
              }`}
              onClick={() => setActiveTab("auto")}
            >
              <Car className="w-4 h-4" />
              Auto
            </Button>
          </div>
        </div>

        {/* Render Correct Tab */}
        {activeTab === "bus" ? (
          isAdmin ? <AdminTransportTab /> : <StudentTransportTab />
        ) : (
          isAdmin ? <AdminAutoTab /> : <StudentAutoTab />
        )}
      </main>
    </div>
  );
};

export default TransportPage;
