import apiClient from '../lib/api';

export interface RouteGroup {
  id: number;
  nome: string;
  cor: string;
  motorista_id?: string;
  data_criacao: string;
  ativo: boolean;
  deliveryCount?: number;
  completedCount?: number;
}

export interface CreateRouteGroupData {
  nome: string;
  cor: string;
  motorista_id?: string;
}

export class RouteGroupService {
  // Listar todos os grupos de rotas
  static async findAll(): Promise<RouteGroup[]> {
    try {
      const response = await apiClient.get<RouteGroup[]>('/route-groups');
      return response || [];
    } catch (error) {
      console.error('Erro ao buscar grupos de rotas:', error);
      return [];
    }
  }

  // Criar grupo de rotas
  static async create(data: CreateRouteGroupData): Promise<RouteGroup> {
    try {
      const response = await apiClient.post<RouteGroup>('/route-groups', {
        nome: data.nome,
        cor: data.cor,
        motorista_id: data.motorista_id
      });
      return response;
    } catch (error) {
      console.error('Erro ao criar grupo de rotas:', error);
      throw error;
    }
  }

  // Buscar por ID
  static async findById(id: number): Promise<RouteGroup | null> {
    try {
      const response = await apiClient.get<RouteGroup>(`/route-groups/${id}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar grupo de rotas:', error);
      return null;
    }
  }

  // Atualizar grupo
  static async update(id: number, data: Partial<CreateRouteGroupData>): Promise<RouteGroup | null> {
    try {
      const response = await apiClient.patch<RouteGroup>(`/route-groups/${id}`, data);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar grupo de rotas:', error);
      return null;
    }
  }

  // Deletar grupo (soft delete)
  static async delete(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/route-groups/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar grupo de rotas:', error);
      return false;
    }
  }

  // Buscar grupos por motorista
  static async findByDriverId(driverId: string): Promise<RouteGroup[]> {
    try {
      const response = await apiClient.get<RouteGroup[]>(`/route-groups/driver/${driverId}`);
      return response || [];
    } catch (error) {
      console.error('Erro ao buscar grupos do motorista:', error);
      return [];
    }
  }

  // Obter estatísticas
  static async getStats(): Promise<{
    total: number;
    assigned: number;
    unassigned: number;
  }> {
    try {
      const response = await apiClient.get<any>('/route-groups/stats');
      return response;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total: 0,
        assigned: 0,
        unassigned: 0
      };
    }
  }
}
