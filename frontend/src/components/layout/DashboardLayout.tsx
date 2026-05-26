import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Apple,
  Users,
  Building2,
  Box,
  ShoppingBag,
  Tag,
  Wrench,
  Car,
  LogOut,
  Menu,
  X,
  BarChart3,
  Layers3,
  ShieldCheck,
  UserCircle2,
  KeyRound,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigation = [
  { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Fretes', href: '/fretes', icon: Truck },
  { name: 'Cargas', href: '/cargas', icon: Layers3 },
  { name: 'Produtores', href: '/produtores', icon: Users },
  { name: 'Firmas', href: '/firmas', icon: Building2 },
  { name: 'Lista de Precos', href: '/lista-precos', icon: Tag },
  { name: 'Produtos', href: '/produtos', icon: Apple },
  { name: 'Embalagens', href: '/embalagens', icon: Box },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { name: 'Serviços', href: '/servicos', icon: ShoppingBag },
  { name: 'Frota', href: '/frota', icon: Car },
  { name: 'Manutenções', href: '/manutencoes', icon: Wrench },
];

const adminNavigation = [
  { name: 'Usuários', href: '/usuarios', icon: ShieldCheck, adminOnly: true },
  { name: 'Perfis', href: '/perfis', icon: KeyRound, adminOnly: true },
];

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const roleNames = Array.isArray(user?.roles)
    ? user.roles.map((role: any) => String(role?.name ?? '').toUpperCase())
    : [];
  const isAdmin = roleNames.includes('ADMIN');

  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';
  const displayEmail = user?.email || '';
  const userInitial = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300 print:hidden ${
          sidebarOpen ? 'w-64' : '-translate-x-full md:translate-x-0 md:w-16'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-primary">Bernal Hortifruti</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </NavLink>
            ))}
          </nav>

          {isAdmin && (
            <div className="mt-6 border-t border-border pt-4">
              {sidebarOpen && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Administração
                </p>
              )}
              <nav className="space-y-1">
                {adminNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && <span>{item.name}</span>}
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 w-full transition-all duration-300 print:ml-0 ${
        sidebarOpen ? 'md:ml-64' : 'md:ml-16'
      }`}>
        <div className="flex items-center justify-end border-b border-border bg-background px-4 py-3 sm:px-6 print:hidden">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto gap-3 border border-border px-2 py-2">
                <div className="min-w-0 text-right">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                </div>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                  {userInitial}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="min-w-0">
                  <p className="truncate">{displayName}</p>
                  {displayEmail && (
                    <p className="truncate text-xs font-normal text-muted-foreground">{displayEmail}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/perfil')} className="cursor-pointer">
                <UserCircle2 className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile menu button */}
        {!sidebarOpen && (
          <div className="md:hidden fixed top-4 left-4 z-30">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        )}
        
        <div className="container mx-auto p-4 sm:p-6 print:max-w-none print:p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
