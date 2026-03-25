import { apiClient } from '@/lib/api';

export interface CreateUserData {
  nome: string;
  email: string;
  senha: string;
  papel: 'admin' | 'operator' | 'driver';
  driver_id?: string;
}

export interface UpdateUserData {
  nome?: string;
  email?: string;
  senha?: string;
  papel?: 'admin' | 'operator' | 'driver';
  driver_id?: string;
  ativo?: boolean;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  papel: 'admin' | 'operator' | 'driver';
  driver_id?: string;
  ativo: boolean;
  email_verificado: boolean;
  ultimo_login?: string;
  criado_em: string;
  atualizado_em: string;
}

export class UserService {
  // Listar todos os usuários
  static async findAll(): Promise<User[]> {
    try {
      console.log('📋 Buscando usuários no backend...');
      const users = await apiClient.get('/users');
      console.log('✅ Usuários carregados:', users);
      return users;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      throw error;
    }
  }

  // Buscar usuário por ID
  static async findById(id: string): Promise<User | null> {
    try {
      console.log(`🔍 Buscando usuário ${id}...`);
      const user = await apiClient.get(`/users/${id}`);
      console.log('✅ Usuário encontrado:', user);
      return user;
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`❌ Usuário ${id} não encontrado`);
        return null;
      }
      console.error('❌ Erro ao buscar usuário:', error);
      throw error;
    }
  }

  // Buscar usuários por papel
  static async findByRole(papel: 'admin' | 'operator' | 'driver'): Promise<User[]> {
    try {
      console.log(`📋 Buscando usuários com papel ${papel}...`);
      const users = await apiClient.get(`/users/role/${papel}`);
      console.log(`✅ ${users.length} usuários encontrados com papel ${papel}`);
      return users;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários por papel:', error);
      throw error;
    }
  }

  // Criar novo usuário
  static async create(userData: CreateUserData): Promise<User> {
    try {
      console.log('👤 Criando novo usuário:', userData.email);
      const user = await apiClient.post('/users', userData);
      console.log('✅ Usuário criado com sucesso:', user);
      return user;
    } catch (error: any) {
      console.error('❌ Erro ao criar usuário:', error);
      
      if (error.status === 400) {
        const errorMessage = error.data?.error || 'Dados inválidos';
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  }

  // Atualizar usuário
  static async update(id: string, data: UpdateUserData): Promise<User> {
    try {
      console.log(`🔄 Atualizando usuário ${id}:`, data);
      const updatedUser = await apiClient.put(`/users/${id}`, data);
      console.log('✅ Usuário atualizado com sucesso:', updatedUser);
      return updatedUser;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar usuário:', error);
      
      if (error.status === 400) {
        const errorMessage = error.data?.error || 'Dados inválidos';
        throw new Error(errorMessage);
      }
      
      if (error.status === 404) {
        throw new Error('Usuário não encontrado');
      }
      
      throw error;
    }
  }

  // Desativar usuário
  static async deactivate(id: string): Promise<void> {
    try {
      console.log(`🗑️ Desativando usuário ${id}...`);
      await apiClient.delete(`/users/${id}`);
      console.log('✅ Usuário desativado com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao desativar usuário:', error);
      
      if (error.status === 404) {
        throw new Error('Usuário não encontrado');
      }
      
      throw error;
    }
  }

  // Obter estatísticas dos usuários
  static async getStats(): Promise<{ papel: string; total: number }[]> {
    try {
      console.log('📊 Buscando estatísticas dos usuários...');
      const stats = await apiClient.get('/users/stats');
      console.log('✅ Estatísticas obtidas:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // Verificar se email já existe
  static async emailExists(email: string, excludeId?: string): Promise<boolean> {
    try {
      const users = await this.findAll();
      return users.some(user => 
        user.email === email && 
        (excludeId ? user.id !== excludeId : true)
      );
    } catch (error) {
      console.error('❌ Erro ao verificar email:', error);
      return false;
    }
  }
}
