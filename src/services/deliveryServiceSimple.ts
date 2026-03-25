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
  // Listar todas as entregas (simulado - não implementado no servidor de teste)
  static async findAll(): Promise<Delivery[]> {
    try {
      // Por enquanto, retorna array vazio até implementar no servidor
      return [];
    } catch (error) {
      console.error('Erro ao buscar entregas:', error);
      return [];
    }
  }

  // Criar entrega (simulado)
  static async create(data: CreateDeliveryData): Promise<Delivery> {
    try {
      // Por enquanto, simula criação sem salvar no banco
      const delivery: Delivery = {
        id: Math.random().toString(36).substring(7),
        trackingCode: data.codigo_rastreio,
        recipientName: data.nome_destinatario || 'Sem nome',
        address: data.endereco,
        number: data.numero,
        complement: data.complemento,
        neighborhood: data.bairro,
        city: data.cidade,
        state: data.estado,
        zipCode: data.cep,
        status: data.status || 'pending',
        assignedTo: data.motorista_id,
        routeGroup: data.rota_grupo,
        order: data.ordem_entrega,
        notes: data.observacoes,
        rawData: data.dados_brutos
      };
      
      return delivery;
    } catch (error) {
      console.error('Erro ao criar entrega:', error);
      throw error;
    }
  }

  // Criar múltiplas entregas (simulado)
  static async bulkCreate(deliveries: CreateDeliveryData[]): Promise<Delivery[]> {
    try {
      const createdDeliveries: Delivery[] = [];
      
      for (const deliveryData of deliveries) {
        const delivery = await this.create(deliveryData);
        createdDeliveries.push(delivery);
      }
      
      return createdDeliveries;
    } catch (error) {
      console.error('Erro ao criar entregas em lote:', error);
      throw error;
    }
  }

  // Atualizar entrega (simulado)
  static async update(id: string, data: Partial<CreateDeliveryData>): Promise<Delivery> {
    try {
      // Por enquanto, simula atualização
      const delivery: Delivery = {
        id,
        trackingCode: data.codigo_rastreio,
        recipientName: data.nome_destinatario,
        address: data.endereco,
        number: data.numero,
        complement: data.complemento,
        neighborhood: data.bairro,
        city: data.cidade,
        state: data.estado,
        zipCode: data.cep,
        status: data.status as Delivery['status'] || 'pending',
        assignedTo: data.motorista_id,
        routeGroup: data.rota_grupo,
        order: data.ordem_entrega,
        notes: data.observacoes,
        rawData: data.dados_brutos
      };
      
      return delivery;
    } catch (error) {
      console.error('Erro ao atualizar entrega:', error);
      throw error;
    }
  }

  // Deletar entrega (simulado)
  static async delete(id: string): Promise<boolean> {
    try {
      // Por enquanto, simula deleção
      console.log('Deletando entrega:', id);
      return true;
    } catch (error) {
      console.error('Erro ao deletar entrega:', error);
      return false;
    }
  }

  // Atualizar status (simulado)
  static async updateStatus(id: string, status: Delivery['status']): Promise<Delivery | null> {
    try {
      return await this.update(id, { status });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return null;
    }
  }

  // Atribuir a motorista (simulado)
  static async assignToDriver(id: string, motorista_id: string, rota_grupo?: number, ordem_entrega?: number): Promise<Delivery | null> {
    try {
      return await this.update(id, { 
        motorista_id, 
        rota_grupo, 
        ordem_entrega,
        status: 'in_transit' 
      });
    } catch (error) {
      console.error('Erro ao atribuir motorista:', error);
      return null;
    }
  }

  // Buscar por código de rastreio (simulado)
  static async findByTrackingCode(codigo_rastreio: string): Promise<Delivery | null> {
    try {
      // Por enquanto, simula busca
      console.log('Buscando entrega por código:', codigo_rastreio);
      return null;
    } catch (error) {
      console.error('Erro ao buscar por código:', error);
      return null;
    }
  }

  // Buscar por grupo de rota (simulado)
  static async findByRouteGroup(rota_grupo: number): Promise<Delivery[]> {
    try {
      // Por enquanto, simula busca
      console.log('Buscando entregas do grupo:', rota_grupo);
      return [];
    } catch (error) {
      console.error('Erro ao buscar por grupo:', error);
      return [];
    }
  }

  // Obter estatísticas (simulado)
  static async getStatistics(): Promise<{
    total: number;
    pending: number;
    in_transit: number;
    delivered: number;
    failed: number;
  }> {
    try {
      // Por enquanto, retorna estatísticas zeradas
      return {
        total: 0,
        pending: 0,
        in_transit: 0,
        delivered: 0,
        failed: 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total: 0,
        pending: 0,
        in_transit: 0,
        delivered: 0,
        failed: 0
      };
    }
  }
}
