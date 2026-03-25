import { executeQuery, executeSingleQuery } from '../config/postgres';
import { v4 as uuidv4 } from 'uuid';

export interface Driver {
  id: string;
  nome: string;
  telefone?: string;
  veiculo?: string;
  placa?: string;
  cidade: string;
  bairro: string;
  estado?: string;
  ativo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface CoverageArea {
  id: number;
  motorista_id: string;
  cidade: string;
  bairro: string;
  estado?: string;
  created_at?: Date;
}

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

export class DriverModel {
  // Create driver with coverage areas
  static async create(data: CreateDriverData): Promise<Driver> {
    const id = uuidv4();
    
    // Insert driver
    const driverQuery = 'INSERT INTO motoristas (id, nome, telefone, veiculo, placa, cidade, bairro, estado, ativo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
    
    const driverParams = [
      id,
      data.nome,
      data.telefone || null,
      data.veiculo || null,
      data.placa || null,
      data.cidade,
      data.bairro,
      data.estado || null,
      data.ativo !== undefined ? data.ativo : true
    ];

    await executeSingleQuery(driverQuery, driverParams);

    // Insert coverage areas if provided
    if (data.coverageAreas && data.coverageAreas.length > 0) {
      await this.addCoverageAreas(id, data.coverageAreas);
    }

    const result = await this.findById(id);
    if (!result) {
      throw new Error('Driver not found after creation');
    }
    return result;
  }

  // Find by ID with coverage areas
  static async findById(id: string): Promise<Driver | null> {
    const query = 'SELECT * FROM motoristas WHERE id = ?';
    const results = await executeQuery<Driver>(query, [id]);
    return results[0] || null;
  }

  // Find all with optional filters
  static async findAll(filters: {
    ativo?: boolean;
    cidade?: string;
    bairro?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Driver[]> {
    let query = 'SELECT * FROM motoristas WHERE 1=1';
    const params: any[] = [];

    if (filters.ativo !== undefined) {
      query += ' AND ativo = ?';
      params.push(filters.ativo);
    }

    if (filters.cidade) {
      query += ' AND cidade LIKE ?';
      params.push(`%${filters.cidade}%`);
    }

    if (filters.bairro) {
      query += ' AND bairro LIKE ?';
      params.push(`%${filters.bairro}%`);
    }

    query += ' ORDER BY nome ASC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    return executeQuery<Driver>(query, params);
  }

  // Update driver
  static async update(id: string, data: Partial<CreateDriverData>): Promise<Driver | null> {
    const fields: string[] = [];
    const params: any[] = [];

    // Update driver fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'coverageAreas') {
        fields.push(`${key} = $${params.length + 1}`);
        params.push(value);
      }
    });

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = 'UPDATE motoristas SET ' + fields.join(', ') + ' WHERE id = $' + (params.length);
      await executeSingleQuery(query, params);
    }

    // Update coverage areas if provided
    if (data.coverageAreas !== undefined) {
      await this.updateCoverageAreas(id, data.coverageAreas);
    }

    return this.findById(id);
  }

  // Delete driver
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM motoristas WHERE id = ?';
    const result = await executeSingleQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Toggle active status
  static async toggleActive(id: string): Promise<Driver | null> {
    const query = 'UPDATE motoristas SET ativo = NOT ativo, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await executeSingleQuery(query, [id]);
    return this.findById(id);
  }

  // Get coverage areas for a driver
  static async getCoverageAreas(driverId: string): Promise<CoverageArea[]> {
    const query = 'SELECT * FROM areas_cobertura WHERE motorista_id = $1 ORDER BY cidade, bairro';
    return executeQuery<CoverageArea>(query, [driverId]);
  }

  // Add coverage areas to a driver
  static async addCoverageAreas(driverId: string, areas: Array<{ cidade: string; bairro: string; estado?: string }>): Promise<void> {
    if (areas.length === 0) return;

    const placeholders = areas.map(() => '(?, ?, ?)').join(', ');
    const query = 'INSERT INTO areas_cobertura (motorista_id, cidade, bairro, estado) VALUES ' + placeholders;

    const params: any[] = [];
    areas.forEach(area => {
      params.push(driverId, area.cidade, area.bairro, area.estado || null);
    });

    await executeSingleQuery(query, params);
  }

  // Update coverage areas (replace all)
  static async updateCoverageAreas(driverId: string, areas: Array<{ cidade: string; bairro: string; estado?: string }>): Promise<void> {
    // Delete existing coverage areas
    await executeSingleQuery('DELETE FROM areas_cobertura WHERE motorista_id = $1', [driverId]);
    
    // Add new coverage areas
    await this.addCoverageAreas(driverId, areas);
  }

  // Remove coverage area
  static async removeCoverageArea(areaId: number): Promise<boolean> {
    const query = 'DELETE FROM areas_cobertura WHERE id = $1';
    const result = await executeSingleQuery(query, [areaId]);
    return result.affectedRows > 0;
  }

  // Get drivers with coverage areas
  static async findWithCoverageAreas(driverId?: string): Promise<Array<Driver & { coverageAreas: CoverageArea[] }>> {
    let query = `
      SELECT 
        m.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', ac.id,
            'cidade', ac.cidade,
            'bairro', ac.bairro,
            'estado', ac.estado,
            'created_at', ac.created_at
          )
        ) as coverage_areas_json
      FROM motoristas m
      LEFT JOIN areas_cobertura ac ON m.id = ac.motorista_id
    `;

    const params: any[] = [];

    if (driverId) {
      query += ' WHERE m.id = $1';
      params.push(driverId);
    }

    query += ' GROUP BY m.id ORDER BY m.nome ASC';

    const results = await executeQuery<any>(query, params);
    
    return results.map(row => ({
      ...row,
      coverageAreas: row.coverage_areas_json ? JSON.parse(row.coverage_areas_json).filter((ca: any) => ca.id !== null) : []
    }));
  }

  // Get statistics
  static async getStatistics(): Promise<{
    total: number;
    ativos: number;
    inativos: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) as inativos
      FROM motoristas
    `;
    
    const results = await executeQuery<any>(query);
    return results[0] || { total: 0, ativos: 0, inativos: 0 };
  }

  // Find drivers available for a specific area
  static async findAvailableForArea(cidade: string, bairro: string): Promise<Driver[]> {
    const query = `
      SELECT DISTINCT m.* FROM motoristas m
      WHERE m.ativo = 1
      AND (
        (LOWER(m.cidade) = LOWER(?) AND LOWER(m.bairro) = LOWER(?))
        OR EXISTS (
          SELECT 1 FROM motoristas_areas_cobertura ac 
          WHERE ac.motorista_id = m.id 
          AND LOWER(ac.cidade) = LOWER(?) 
          AND LOWER(ac.bairro) = LOWER(?)
        )
      )
      ORDER BY m.nome ASC
    `;
    
    return executeQuery<Driver>(query, [cidade, bairro, cidade, bairro]);
  }

  // Search drivers by name, city or neighborhood
  static async search(searchTerm: string): Promise<Driver[]> {
    const query = `
      SELECT * FROM motoristas 
      WHERE (
        LOWER(nome) LIKE LOWER(?) OR
        LOWER(cidade) LIKE LOWER(?) OR
        LOWER(bairro) LIKE LOWER(?) OR
        LOWER(telefone) LIKE LOWER(?)
      )
      ORDER BY nome ASC
    `;
    
    const searchPattern = `%${searchTerm}%`;
    return executeQuery<Driver>(query, [searchPattern, searchPattern, searchPattern, searchPattern]);
  }
}
