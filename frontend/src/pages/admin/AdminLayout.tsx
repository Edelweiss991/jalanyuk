import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Bus, TrainFront, TicketCheck, Users, BarChart3,
  Settings, ScrollText, FlaskConical, LogOut, Home,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../components/ThemeToggle';
import { cn } from '../../lib/format';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/buses', label: 'Manajemen Bus', icon: Bus },
  { to: '/admin/trains', label: 'Manajemen Kereta', icon: TrainFront },
  { to: '/admin/bookings', label: 'Booking', icon: TicketCheck },
  { to: '/admin/users', label: 'Pengguna', icon: Users },
  { to: '/admin/reports', label: 'Laporan', icon: BarChart3 },
  { to: '/admin/settings', label: 'Pengaturan', icon: Settings },
  { to: '/admin/audit-logs', label: 'Audit Log', icon: ScrollText },
  { to: '/admin/algorithm-lab', label: 'Algorithm Lab', icon: FlaskConical },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-card">
        <div className="p-5 border-b">
          <div className="text-xl font-bold text-primary">AYORA</div>
          <div className="text-xs text-muted-foreground">Panel Admin • Data Simulasi</div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t space-y-3">
          <div className="text-sm">
            <div className="font-medium">{user?.profile?.fullName || user?.email}</div>
            <div className="text-xs text-muted-foreground">{user?.email} • ADMIN</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md border hover:bg-accent"
            >
              <Home className="h-3.5 w-3.5" /> Situs Publik
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md border hover:bg-accent"
            >
              <LogOut className="h-3.5 w-3.5" /> Keluar
            </button>
            <ThemeToggle />
          </div>
          <p className="text-[11px] text-muted-foreground">© 2026 AYORA. All rights reserved.</p>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between border-b bg-card px-4 py-3">
          <span className="font-bold text-primary">AYORA Admin</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => { logout(); navigate('/login'); }} className="text-sm flex items-center gap-1">
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        </header>
        <nav className="md:hidden flex gap-2 overflow-x-auto p-3 border-b bg-card">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn('whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium border',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-background')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="p-4 md:p-6 max-w-[1200px] mx-auto">
          <Outlet />
        </main>
        <footer className="px-6 pb-6 text-center text-xs text-muted-foreground md:hidden">
          © 2026 AYORA. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
