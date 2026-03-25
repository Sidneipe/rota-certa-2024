import apiClient from '../lib/api';
import { User, LoginCredentials, RegisterData, AuthState, UserRole, Permission, ROLE_PERMISSIONS } from '../types/auth';
import { UserService } from './userService';

const STORAGE_KEY = 'rotaflex_auth';

export class AuthService {
  // Login
  static async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      // Simulação de login - em produção, isso iria para o backend
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Administrador',
          email: 'admin@rotaflex.com',
          role: UserRole.ADMIN,
          permissions: ROLE_PERMISSIONS[UserRole.ADMIN],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        },
        {
          id: '2',
          name: 'Operador',
          email: 'operator@rotaflex.com',
          role: UserRole.OPERATOR,
          permissions: ROLE_PERMISSIONS[UserRole.OPERATOR],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        },
        {
          id: '3',
          name: 'Motorista',
          email: 'driver@rotaflex.com',
          role: UserRole.DRIVER,
          permissions: ROLE_PERMISSIONS[UserRole.DRIVER],
          driverId: 'driver-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        }
      ];

      const user = mockUsers.find(u => u.email === credentials.email);
      
      if (!user || !this.validatePassword(credentials.password, user.role)) {
        throw new Error('Email ou senha inválidos');
      }

      if (!user.isActive) {
        throw new Error('Usuário inativo');
      }

      // Gerar token mock
      const token = this.generateToken(user);
      
      // Atualizar último login
      user.lastLogin = new Date().toISOString();
      
      // Salvar no localStorage
      this.saveAuthData({ user, token });
      
      return { user, token };
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  // Registro
  static async register(data: RegisterData): Promise<{ user: User; token: string }> {
    try {
      console.log('📝 Registrando usuário no backend:', data.email);

      // Criar usuário no backend
      const backendUser = await UserService.create({
        nome: data.name,
        email: data.email,
        senha: data.password,
        papel: data.role,
        driver_id: data.driverId
      });

      // Converter para o formato do frontend
      const user: User = {
        id: backendUser.id,
        name: backendUser.nome,
        email: backendUser.email,
        role: backendUser.papel as UserRole,
        permissions: ROLE_PERMISSIONS[backendUser.papel as UserRole],
        driverId: backendUser.driver_id,
        createdAt: backendUser.criado_em,
        updatedAt: backendUser.atualizado_em,
        isActive: backendUser.ativo
      };

      const token = this.generateToken(user);
      this.saveAuthData({ user, token });

      console.log('Usuário criado com sucesso:', user);
      return { user, token };
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  // Logout
  static logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Obter usuário atual
  static getCurrentUser(): User | null {
    const authData = localStorage.getItem(STORAGE_KEY);
    if (!authData) return null;

    try {
      const { user, token } = JSON.parse(authData);
      
      // Verificar se o token é válido (simulação)
      if (this.isTokenValid(token)) {
        return user;
      } else {
        // Token inválido, remover do storage
        this.logout();
        return null;
      }
    } catch {
      this.logout();
      return null;
    }
  }

  // Verificar se usuário está autenticado
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Verificar permissão do usuário
  static hasPermission(permission: Permission): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    return user.permissions.includes(permission);
  }

  // Verificar se usuário tem algum dos papéis
  static hasRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    return roles.includes(user.role);
  }

  // Obter estado inicial de autenticação
  static getInitialAuthState(): AuthState {
    const user = this.getCurrentUser();
    
    return {
      user,
      isAuthenticated: user !== null,
      isLoading: false,
      error: null
    };
  }

  // Métodos privados
  private static saveAuthData(data: { user: User; token: string }): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private static generateToken(user: User): string {
    // Simulação de geração de token
    return btoa(JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      timestamp: Date.now()
    }));
  }

  private static isTokenValid(token: string): boolean {
    try {
      const decoded = JSON.parse(atob(token));
      // Token válido por 24 horas
      return Date.now() - decoded.timestamp < 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }

  private static validatePassword(password: string, role: UserRole): boolean {
    // Simulação de validação de senha
    const passwords = {
      [UserRole.ADMIN]: 'admin123',
      [UserRole.OPERATOR]: 'operator123',
      [UserRole.DRIVER]: 'driver123'
    };
    
    return password === passwords[role] || password === 'senha123';
  }

  private static generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private static getStoredUsers(): User[] {
    const stored = localStorage.getItem('rotaflex_users');
    return stored ? JSON.parse(stored) : [];
  }

  // Atualizar usuário
  static async updateUser(userId: string, data: Partial<User>): Promise<User> {
    try {
      console.log('🔄 Atualizando usuário no backend:', userId, data);

      // Converter dados para o formato do backend
      const backendData: any = {};
      
      if (data.name) backendData.nome = data.name;
      if (data.email) backendData.email = data.email;
      if (data.role) backendData.papel = data.role;
      if (data.driverId !== undefined) backendData.driver_id = data.driverId;
      if (data.isActive !== undefined) backendData.ativo = data.isActive;

      // Atualizar no backend
      const backendUser = await UserService.update(userId, backendData);

      // Converter para o formato do frontend
      const updatedUser: User = {
        id: backendUser.id,
        name: backendUser.nome,
        email: backendUser.email,
        role: backendUser.papel as UserRole,
        permissions: ROLE_PERMISSIONS[backendUser.papel as UserRole],
        driverId: backendUser.driver_id,
        createdAt: backendUser.criado_em,
        updatedAt: backendUser.atualizado_em,
        isActive: backendUser.ativo
      };

      // Se for o usuário atual, atualizar no storage de auth
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const authData = localStorage.getItem(STORAGE_KEY);
        if (authData) {
          const { token } = JSON.parse(authData);
          this.saveAuthData({ user: updatedUser, token });
        }
      }

      console.log('✅ Usuário atualizado com sucesso:', updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  // Listar usuários (apenas admin)
  static async listUsers(): Promise<User[]> {
    const user = this.getCurrentUser();
    if (!user || !this.hasPermission(Permission.MANAGE_USERS)) {
      throw new Error('Sem permissão para listar usuários');
    }

    try {
      console.log('📋 Listando usuários do backend...');
      
      const backendUsers = await UserService.findAll();
      
      // Converter para o formato do frontend
      const users: User[] = backendUsers.map(backendUser => ({
        id: backendUser.id,
        name: backendUser.nome,
        email: backendUser.email,
        role: backendUser.papel as UserRole,
        permissions: ROLE_PERMISSIONS[backendUser.papel as UserRole],
        driverId: backendUser.driver_id,
        createdAt: backendUser.criado_em,
        updatedAt: backendUser.atualizado_em,
        isActive: backendUser.ativo
      }));

      console.log(`✅ ${users.length} usuários carregados do backend`);
      return users;
    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error);
      throw error;
    }
  }

  // Desativar usuário (apenas admin)
  static async deactivateUser(userId: string): Promise<void> {
    const user = this.getCurrentUser();
    if (!user || !this.hasPermission(Permission.MANAGE_USERS)) {
      throw new Error('Sem permissão para desativar usuários');
    }

    await this.updateUser(userId, { isActive: false });
  }
}
