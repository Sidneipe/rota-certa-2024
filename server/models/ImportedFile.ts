import { executeQuery, executeSingleQuery } from '../config/postgres';

export interface ImportedFile {
  id: number;
  nome_arquivo: string;
  tipo_arquivo: 'pdf' | 'xlsx' | 'xls' | 'csv';
  tamanho_arquivo: number;
  quantidade_registros: number;
  data_importacao: Date;
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

export class ImportedFileModel {
  // Create imported file record
  static async create(data: CreateImportedFileData): Promise<ImportedFile> {
    const query = `
      INSERT INTO arquivos_importados (
        nome_arquivo, tipo_arquivo, tamanho_arquivo, quantidade_registros, 
        status_importacao, erro_importacao
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      data.nome_arquivo,
      data.tipo_arquivo,
      data.tamanho_arquivo,
      data.quantidade_registros,
      data.status_importacao || 'processing',
      data.erro_importacao || null
    ];

    const result = await executeSingleQuery(query, params);
    
    // Get the inserted ID
    const insertedId = result.insertId;
    
    const file = await this.findById(insertedId);
    if (!file) {
      throw new Error('Imported file not found after creation');
    }
    return file;
  }

  // Find imported file by ID
  static async findById(id: number): Promise<ImportedFile | null> {
    const query = 'SELECT * FROM arquivos_importados WHERE id = ?';
    const results = await executeQuery<ImportedFile>(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  // Update imported file status
  static async updateStatus(id: number, status: 'processing' | 'completed' | 'failed', error?: string): Promise<boolean> {
    const query = `
      UPDATE arquivos_importados 
      SET status_importacao = ?, erro_importacao = ? 
      WHERE id = ?
    `;
    
    const params = [status, error || null, id];
    const result = await executeSingleQuery(query, params);
    return result.affectedRows > 0;
  }

  // List all imported files
  static async findAll(limit?: number): Promise<ImportedFile[]> {
    let query = 'SELECT * FROM arquivos_importados ORDER BY data_importacao DESC';
    const params: any[] = [];
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    return executeQuery<ImportedFile>(query, params);
  }

  // List imported files by date range
  static async findByDateRange(startDate: Date, endDate: Date): Promise<ImportedFile[]> {
    const query = 'SELECT * FROM arquivos_importados WHERE data_importacao BETWEEN ? AND ? ORDER BY data_importacao DESC';
    return executeQuery<ImportedFile>(query, [startDate, endDate]);
  }

  // Get statistics
  static async getStats(): Promise<{
    total: number;
    pdf: number;
    spreadsheet: number;
    completed: number;
    processing: number;
    failed: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN tipo_arquivo = 'pdf' THEN 1 ELSE 0 END) as pdf,
        SUM(CASE WHEN tipo_arquivo IN ('xlsx', 'xls', 'csv') THEN 1 ELSE 0 END) as spreadsheet,
        SUM(CASE WHEN status_importacao = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status_importacao = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status_importacao = 'failed' THEN 1 ELSE 0 END) as failed
      FROM arquivos_importados
    `;
    
    const results = await executeQuery<any>(query);
    return results.length > 0 ? results[0] : {
      total: 0,
      pdf: 0,
      spreadsheet: 0,
      completed: 0,
      processing: 0,
      failed: 0
    };
  }

  // Delete imported file record
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM arquivos_importados WHERE id = ?';
    const result = await executeSingleQuery(query, [id]);
    return result.affectedRows > 0;
  }
}
