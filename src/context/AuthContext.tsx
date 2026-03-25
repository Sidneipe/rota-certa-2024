import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User, LoginCredentials, RegisterData, Permission, UserRole } from '../types/auth';
import { AuthService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
  updateUser: (data: Partial<User>) => Promise<void>;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = AuthService.getInitialAuthState();

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const { user } = await AuthService.login(credentials);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const { user } = await AuthService.register(data);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer cadastro';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const hasPermission = (permission: Permission): boolean => {
    return AuthService.hasPermission(permission);
  };

  const hasRole = (roles: UserRole[]): boolean => {
    return AuthService.hasRole(roles);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!state.user) return;

    try {
      const updatedUser = await AuthService.updateUser(state.user.id, data);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  // Verificar autenticação ao carregar
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    hasPermission,
    hasRole,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook para proteção de rotas
export function useRequireAuth() {
  const auth = useAuth();
  
  if (!auth.isAuthenticated && !auth.isLoading) {
    return { ...auth, isAuthorized: false };
  }
  
  return { ...auth, isAuthorized: true };
}

// Hook para verificar permissões específicas
export function useRequirePermission(permission: Permission) {
  const auth = useAuth();
  
  if (!auth.isAuthenticated) {
    return { ...auth, isAuthorized: false };
  }
  
  const hasPermission = auth.hasPermission(permission);
  
  return { 
    ...auth, 
    isAuthorized: hasPermission,
    permissionRequired: permission
  };
}

// Hook para verificar papéis específicos
export function useRequireRole(roles: UserRole[]) {
  const auth = useAuth();
  
  if (!auth.isAuthenticated) {
    return { ...auth, isAuthorized: false };
  }
  
  const hasRole = auth.hasRole(roles);
  
  return { 
    ...auth, 
    isAuthorized: hasRole,
    rolesRequired: roles
  };
}
