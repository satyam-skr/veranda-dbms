import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { LogOut, ArrowLeft, Bus } from "lucide-react";
import AdminTransportTab from "./AdminTransportTab";
import StudentTransportTab from "./StudentTransportTab";

const TransportPage = () => {
  const { currentUser, hasRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = hasRole("super_admin");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ✅ Unified Veranda Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          
          {/* LEFT SIDE: Back + Veranda */}
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

            <Link to="/" className="text-2xl font-bold text-primary hover:opacity-80">
              Veranda
            </Link>
          </div>

          {/* CENTER NAV */}
          <nav className="hidden md:flex items-center space-x-6 text-sm text-foreground">
            <Link to="/olx" className="hover:text-primary transition">OLX</Link>
            <Link to="/mess" className="hover:text-primary transition">Mess</Link>
            <Link
              to="/transport"
              className={`hover:text-primary transition ${
                location.pathname.includes("transport") ? "text-primary font-medium" : ""
              }`}
            >
              Transport
            </Link>
            <Link to="/shop" className="hover:text-primary transition">Shop (Poll)</Link>
            <Link to="/complaint" className="hover:text-primary transition">General Complaint</Link>
          </nav>

          {/* RIGHT SIDE: Role badge + Logout */}
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

      <main className="max-w-6xl mx-auto p-6 space-y-8 bg-gray-50 min-h-[90vh]">
        <div className="flex items-center gap-2 mb-6">
          <Bus className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Transport Management</h2>
        </div>

        {isAdmin ? <AdminTransportTab /> : <StudentTransportTab />}
      </main>
    </div>
  );
};

export default TransportPage;
