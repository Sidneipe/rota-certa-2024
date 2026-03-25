import apiClient from '../lib/api';

export interface ImportedFile {
  id: number;
  nome_arquivo: string;
  tipo_arquivo: 'pdf' | 'xlsx' | 'xls' | 'csv';
  tamanho_arquivo: number;
  quantidade_registros: number;
  data_importacao: string;
  status_importacao: 'processing' | 'completed' | 'failed';
  erro_importacao?: string;
}

export interface CreateImportedFileData {
  nome_arquivo: string;
  tipo_arquivo: 'pdf' | 'xlsx' | 'xls' | 'csv';
  tamanho_arquivo: number;
  quantidade_registros: number;
  status_importacao?: 'processing' | 'completed' | 'failed';
  erro_importacao?: string;
}

export class ImportedFileService {
  // Listar todos os arquivos importados
  static async findAll(): Promise<ImportedFile[]> {
    try {
      const response = await apiClient.get<ImportedFile[]>('/imported-files');
      return response || [];
    } catch (error) {
      console.error('Erro ao buscar arquivos importados:', error);
      return [];
    }
  }

  // Criar registro de arquivo importado
  static async create(data: CreateImportedFileData): Promise<ImportedFile> {
    try {
      const response = await apiClient.post<ImportedFile>('/imported-files', {
        nome_arquivo: data.nome_arquivo,
        tipo_arquivo: data.tipo_arquivo,
        tamanho_bytes: data.tamanho_arquivo, // Backend espera tamanho_bytes
        quantidade_registros: data.quantidade_registros,
        status_importacao: data.status_importacao || 'completed'
      });
      return response;
    } catch (error) {
      console.error('Erro ao criar arquivo importado:', error);
      throw error;
    }
  }

  // Buscar por ID
  static async findById(id: number): Promise<ImportedFile | null> {
    try {
      const response = await apiClient.get<ImportedFile>(`/imported-files/${id}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar arquivo importado:', error);
      return null;
    }
  }

  // Atualizar status
  static async updateStatus(id: number, status: 'processing' | 'completed' | 'failed', error?: string): Promise<boolean> {
    try {
      await apiClient.patch(`/imported-files/${id}/status`, {
        status,
        error
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status do arquivo:', error);
      return false;
    }
  }

  // Deletar arquivo
  static async delete(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/imported-files/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar arquivo importado:', error);
      return false;
    }
  }

  // Obter estatísticas
  static async getStats(): Promise<{
    total: number;
    pdf: number;
    spreadsheet: number;
    completed: number;
    processing: number;
    failed: number;
  }> {
    try {
      const response = await apiClient.get<any>('/imported-files/stats');
      return response;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total: 0,
        pdf: 0,
        spreadsheet: 0,
        completed: 0,
        processing: 0,
        failed: 0
      };
    }
  }
}
