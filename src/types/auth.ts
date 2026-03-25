export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  DRIVER = 'driver'
}

export enum Permission {
  // Permissões de Administrador
  MANAGE_USERS = 'manage_users',
  MANAGE_SYSTEM = 'manage_system',
  VIEW_REPORTS = 'view_reports',
  
  // Permissões de Operador
  MANAGE_DELIVERIES = 'manage_deliveries',
  MANAGE_ROUTES = 'manage_routes',
  VIEW_DELIVERIES = 'view_deliveries',
  
  // Permissões de Motorista
  VIEW_OWN_ROUTES = 'view_own_routes',
  UPDATE_DELIVERY_STATUS = 'update_delivery_status',
  VIEW_OWN_DELIVERIES = 'view_own_deliveries'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  driverId?: string; // Apenas para motoristas
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  driverId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Permissões por role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_SYSTEM,
    Permission.VIEW_REPORTS,
    Permission.MANAGE_DELIVERIES,
    Permission.MANAGE_ROUTES,
    Permission.VIEW_DELIVERIES
  ],
  [UserRole.OPERATOR]: [
    Permission.MANAGE_DELIVERIES,
    Permission.MANAGE_ROUTES,
    Permission.VIEW_DELIVERIES
  ],
  [UserRole.DRIVER]: [
    Permission.VIEW_OWN_ROUTES,
    Permission.UPDATE_DELIVERY_STATUS,
    Permission.VIEW_OWN_DELIVERIES
  ]
};

// Labels para exibição
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.OPERATOR]: 'Operador',
  [UserRole.DRIVER]: 'Motorista'
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.MANAGE_USERS]: 'Gerenciar Usuários',
  [Permission.MANAGE_SYSTEM]: 'Gerenciar Sistema',
  [Permission.VIEW_REPORTS]: 'Ver Relatórios',
  [Permission.MANAGE_DELIVERIES]: 'Gerenciar Entregas',
  [Permission.MANAGE_ROUTES]: 'Gerenciar Rotas',
  [Permission.VIEW_DELIVERIES]: 'Ver Entregas',
  [Permission.VIEW_OWN_ROUTES]: 'Ver Minhas Rotas',
  [Permission.UPDATE_DELIVERY_STATUS]: 'Atualizar Status Entrega',
  [Permission.VIEW_OWN_DELIVERIES]: 'Ver Minhas Entregas'
};
