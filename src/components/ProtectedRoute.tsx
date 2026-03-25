import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useRequireAuth } from '../context/AuthContext';
import { Permission, UserRole } from '../types/auth';
import { AlertCircle, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredRoles,
  fallback 
}: ProtectedRouteProps) {
  const location = useLocation();
  const auth = useRequireAuth();

  // Se está carregando, mostrar loading
  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redirecionar para login
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar permissão específica
  if (requiredPermission && !auth.hasPermission(requiredPermission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta página.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Verificar papéis específicos
  if (requiredRoles && !auth.hasRole(requiredRoles)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600 mb-6">
            Esta página está disponível apenas para {requiredRoles.length === 1 ? 'o papel' : 'os papéis'}:{' '}
            <span className="font-medium">
              {requiredRoles.map(role => role.charAt(0).toUpperCase() + role.slice(1)).join(' ou ')}
            </span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Componente para verificar apenas autenticação
export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

// Componente para administradores
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      {children}
    </ProtectedRoute>
  );
}

// Componente para operadores e administradores
export function OperatorRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.OPERATOR]}>
      {children}
    </ProtectedRoute>
  );
}

// Componente para motoristas
export function DriverRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={[UserRole.DRIVER]}>
      {children}
    </ProtectedRoute>
  );
}

// Componente para gerenciar usuários (apenas admin)
export function ManageUsersRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredPermission={Permission.MANAGE_USERS}>
      {children}
    </ProtectedRoute>
  );
}

// Componente para gerenciar entregas (operator e admin)
export function ManageDeliveriesRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredPermission={Permission.MANAGE_DELIVERIES}>
      {children}
    </ProtectedRoute>
  );
}

// Componente para ver relatórios (apenas admin)
export function ViewReportsRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_REPORTS}>
      {children}
    </ProtectedRoute>
  );
}
