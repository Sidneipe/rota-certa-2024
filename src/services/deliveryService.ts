import apiClient from '../lib/api';
import { Delivery } from '../types/delivery';

export interface CreateDeliveryData {
  codigo_rastreio?: string;
  nome_destinatario?: string;
  endereco: string;
  numero?: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado?: string;
  cep: string;
  status?: 'pending' | 'in_transit' | 'delivered' | 'failed';
  motorista_id?: string;
  rota_grupo?: number;
  ordem_entrega?: number;
  observacoes?: string;
  dados_brutos?: any;
  arquivo_origem?: string;
}

export class DeliveryService {
  // Listar todas as entregas
  static async findAll(filters?: {
    status?: string;
    motorista_id?: string;
    cidade?: string;
    bairro?: string;
    rota_grupo?: number;
    limit?: number;
    offset?: number;
  }): Promise<Delivery[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.motorista_id) {
      params.append('motorista_id', filters.motorista_id);
    }
    if (filters?.cidade) {
      params.append('cidade', filters.cidade);
    }
    if (filters?.bairro) {
      params.append('bairro', filters.bairro);
    }
    if (filters?.rota_grupo) {
      params.append('rota_grupo', filters.rota_grupo.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      params.append('offset', filters.offset.toString());
    }

    return apiClient.get<Delivery[]>(`/deliveries?${params.toString()}`);
  }

  // Buscar entrega por ID
  static async findById(id: string): Promise<Delivery | null> {
    try {
      return await apiClient.get<Delivery>(`/deliveries/${id}`);
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  // Buscar entrega por código de rastreamento
  static async findByTrackingCode(codigo_rastreio: string): Promise<Delivery | null> {
    try {
      return await apiClient.get<Delivery>(`/deliveries/tracking/${codigo_rastreio}`);
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  // Buscar entregas por grupo de rota
  static async findByRouteGroup(rota_grupo: number): Promise<Delivery[]> {
    return apiClient.get<Delivery[]>(`/deliveries/route/${rota_grupo}`);
  }

  // Criar nova entrega
  static async create(data: CreateDeliveryData): Promise<Delivery> {
    return apiClient.post<Delivery>('/deliveries', data);
  }

  // Criar múltiplas entregas
  static async bulkCreate(deliveries: CreateDeliveryData[]): Promise<{ message: string; count: number }> {
    return apiClient.post<{ message: string; count: number }>('/deliveries/bulk', { deliveries });
  }

  // Atualizar entrega
  static async update(id: string, data: Partial<CreateDeliveryData>): Promise<Delivery> {
    return apiClient.put<Delivery>(`/deliveries/${id}`, data);
  }

  // Atualizar status da entrega
  static async updateStatus(id: string, status: Delivery['status']): Promise<Delivery> {
    return apiClient.patch<Delivery>(`/deliveries/${id}/status`, { status });
  }

  // Atribuir entrega a motorista
  static async assignToDriver(
    id: string, 
    motorista_id: string, 
    rota_grupo?: number, 
    ordem_entrega?: number
  ): Promise<Delivery> {
    return apiClient.patch<Delivery>(`/deliveries/${id}/assign`, {
      motorista_id,
      rota_grupo,
      ordem_entrega
    });
  }

  // Excluir entrega
  static async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/deliveries/${id}`);
  }

  // Obter estatísticas
  static async getStatistics(): Promise<{
    total: number;
    pending: number;
    in_transit: number;
    delivered: number;
    failed: number;
  }> {
    return apiClient.get<{
      total: number;
      pending: number;
      in_transit: number;
      delivered: number;
      failed: number;
    }>('/deliveries/stats');
  }

  // Upload de arquivo e processamento
  static async uploadFile(file: File): Promise<any> {
    return apiClient.uploadFile('/upload', file);
  }

  // Importar entregas de arquivo processado
  static async importFromFile(deliveries: CreateDeliveryData[], fileName: string): Promise<{ message: string; count: number }> {
    const deliveriesWithOrigin = deliveries.map(delivery => ({
      ...delivery,
      arquivo_origem: fileName
    }));

    return this.bulkCreate(deliveriesWithOrigin);
  }
}

// Exportar funções de compatibilidade
export const getDeliveries = DeliveryService.findAll;
export const addDelivery = DeliveryService.create;
export const updateDelivery = (id: string, data: Partial<CreateDeliveryData>) => 
  DeliveryService.update(id, data);
export const deleteDelivery = DeliveryService.delete;
