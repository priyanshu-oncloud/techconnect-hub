import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Share2, Trophy, LogOut, Menu, X } from "lucide-react";
import { useAmbassador } from "@/contexts/AmbassadorContext";
import logo from "@/assets/logo.webp";

const navItems = [
  { name: "Dashboard", path: "/ambassador", icon: LayoutDashboard },
  { name: "Referral Tools", path: "/ambassador/referrals", icon: Share2 },
  { name: "Leaderboard", path: "/ambassador/leaderboard", icon: Trophy },
];

export const AmbassadorLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, profile, user } = useAmbassador();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/ambassador/login");
  };

  const Nav = () => (
    <nav className="space-y-2 p-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <button className="p-2 md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <img src={logo} alt="Nestgen" className="h-9 w-9 rounded-full object-cover" />
            <span className="text-lg font-bold md:text-xl">Ambassador Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="max-w-[160px] truncate text-xs font-medium">
                {profile?.fullName || user?.email}
              </span>
              {profile?.referralCode && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {profile.referralCode}
                </span>
              )}
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-16 hidden min-h-[calc(100vh-4rem)] w-64 border-r border-border bg-card md:block">
          <Nav />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-64 border-r border-border bg-card">
              <div className="flex items-center justify-between border-b p-4">
                <span className="font-bold">Menu</span>
                <button onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Nav />
            </aside>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
};
