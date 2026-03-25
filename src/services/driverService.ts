import apiClient from '../lib/api';
import { Driver, CoverageArea } from '../types/delivery';

export interface CreateDriverData {
  nome: string;
  telefone?: string;
  veiculo?: string;
  placa?: string;
  cidade: string;
  bairro: string;
  estado?: string;
  ativo?: boolean;
  coverageAreas?: Array<{
    cidade: string;
    bairro: string;
    estado?: string;
  }>;
}

export interface DriverWithCoverageAreas extends Driver {
  coverageAreas: CoverageArea[];
}

export class DriverService {
  // Listar todos os motoristas
  static async findAll(filters?: {
    ativo?: boolean;
    cidade?: string;
    bairro?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<Driver[]> {
    const params = new URLSearchParams();
    
    if (filters?.ativo !== undefined) {
      params.append('ativo', filters.ativo.toString());
    }
    if (filters?.cidade) {
      params.append('cidade', filters.cidade);
    }
    if (filters?.bairro) {
      params.append('bairro', filters.bairro);
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      params.append('offset', filters.offset.toString());
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const endpoint = filters?.search 
      ? `/drivers?${params.toString()}`
      : `/drivers?${params.toString()}`;
    
    return apiClient.get<Driver[]>(endpoint);
  }

  // Buscar motorista por ID
  static async findById(id: string): Promise<DriverWithCoverageAreas | null> {
    try {
      return await apiClient.get<DriverWithCoverageAreas>(`/drivers/${id}`);
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  // Criar novo motorista
  static async create(data: CreateDriverData): Promise<Driver> {
    return apiClient.post<Driver>('/drivers', data);
  }

  // Atualizar motorista
  static async update(id: string, data: Partial<CreateDriverData>): Promise<Driver> {
    return apiClient.put<Driver>(`/drivers/${id}`, data);
  }

  // Excluir motorista
  static async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/drivers/${id}`);
  }

  // Alternar status ativo/inativo
  static async toggleActive(id: string): Promise<Driver> {
    return apiClient.patch<Driver>(`/drivers/${id}/toggle-active`);
  }

  // Obter áreas de cobertura de um motorista
  static async getCoverageAreas(driverId: string): Promise<CoverageArea[]> {
    return apiClient.get<CoverageArea[]>(`/drivers/${driverId}/coverage-areas`);
  }

  // Adicionar áreas de cobertura
  static async addCoverageAreas(driverId: string, areas: Array<{
    cidade: string;
    bairro: string;
    estado?: string;
  }>): Promise<CoverageArea[]> {
    return apiClient.post<CoverageArea[]>(`/drivers/${driverId}/coverage-areas`, { areas });
  }

  // Atualizar áreas de cobertura
  static async updateCoverageAreas(driverId: string, areas: Array<{
    cidade: string;
    bairro: string;
    estado?: string;
  }>): Promise<CoverageArea[]> {
    return apiClient.put<CoverageArea[]>(`/drivers/${driverId}/coverage-areas`, { areas });
  }

  // Remover área de cobertura específica
  static async removeCoverageArea(areaId: number): Promise<void> {
    return apiClient.delete<void>(`/drivers/coverage-areas/${areaId}`);
  }

  // Encontrar motoristas disponíveis para uma área
  static async findAvailableForArea(cidade: string, bairro: string): Promise<Driver[]> {
    return apiClient.get<Driver[]>(`/drivers/available/${encodeURIComponent(cidade)}/${encodeURIComponent(bairro)}`);
  }

  // Buscar motoristas
  static async search(searchTerm: string): Promise<Driver[]> {
    return apiClient.get<Driver[]>('/drivers', { search: searchTerm });
  }

  // Obter estatísticas
  static async getStatistics(): Promise<{
    total: number;
    ativos: number;
    inativos: number;
  }> {
    return apiClient.get<{
      total: number;
      ativos: number;
      inativos: number;
    }>('/drivers/stats');
  }

  // Obter motoristas com áreas de cobertura
  static async findWithCoverageAreas(driverId?: string): Promise<DriverWithCoverageAreas[]> {
    const endpoint = driverId ? `/drivers/${driverId}` : '/drivers';
    const drivers = driverId 
      ? [await apiClient.get<DriverWithCoverageAreas>(endpoint)]
      : await apiClient.get<DriverWithCoverageAreas[]>(endpoint);
    
    return driverId ? drivers : drivers as DriverWithCoverageAreas[];
  }
}

// Exportar funções de compatibilidade com o sistema antigo
export const getDrivers = DriverService.findAll;
export const addDriver = DriverService.create;
export const updateDriver = (id: string, data: Partial<CreateDriverData>) => 
  DriverService.update(id, data);
export const deleteDriver = DriverService.delete;
