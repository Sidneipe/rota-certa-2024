import { Truck, Users, Route, Package, LayoutDashboard, LogOut, User, Settings, Shield, History, ClipboardList, TestTube } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole, ROLE_LABELS } from '@/types/auth';

export function Header() {
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/rotas_novo', label: 'Rotas', icon: Route },
    { to: '/planejamento_novo', label: 'Planejamento', icon: ClipboardList },
    { to: '/bingo', label: 'Bingo', icon: TestTube },
    { to: '/pacotes', label: 'Pacotes', icon: Package },
    { to: '/motoristas', label: 'Motoristas', icon: Users },
    { to: '/historico', label: 'Histórico', icon: History },
  ];

  // Adicionar item de usuários apenas para administradores
  if (user && hasPermission('manage_users' as any)) {
    navItems.push({ to: '/usuarios', label: 'Usuários', icon: Users });
  }

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-display font-bold text-foreground leading-tight">
              RotaFlex
            </h1>
            <p className="text-xs text-muted-foreground">
              Organizador de Rotas 
            </p>
          </div>
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === to
                  ? 'gradient-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
        
        {/* User Menu */}
        {user && (
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {user.role === UserRole.ADMIN && <Shield className="w-3 h-3" />}
                {ROLE_LABELS[user.role]}
              </p>
            </div>
            
            <div className="relative group">
              <button className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold hover:from-blue-600 hover:to-indigo-600 transition-colors">
                {user.name.charAt(0).toUpperCase()}
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configurações
                </button>
                
                <button 
                  onClick={logout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
