import { executeQuery, executeSingleQuery } from '../config/postgres';

export interface RouteGroup {
  id: number;
  nome: string;
  cor: string;
  motorista_id?: string;
  data_criacao?: Date;
  ativo: boolean;
}

export interface CreateRouteGroupData {
  nome: string;
  cor: string;
  motorista_id?: string;
}

export class RouteGroupModel {
  // Create route group
  static async create(data: CreateRouteGroupData): Promise<RouteGroup> {
    const query = `
      INSERT INTO grupos_rotas (
        nome, cor, motorista_id
      ) VALUES (?, ?, ?)
    `;
    
    const params = [
      data.nome,
      data.cor,
      data.motorista_id || null
    ];

    const result = await executeSingleQuery(query, params);
    
    // Get the inserted ID
    const insertedId = result.insertId;
    
    const routeGroup = await this.findById(insertedId);
    if (!routeGroup) {
      throw new Error('Route group not found after creation');
    }
    return routeGroup;
  }

  // Find route group by ID
  static async findById(id: number): Promise<RouteGroup | null> {
    const query = 'SELECT * FROM grupos_rotas WHERE id = ?';
    const results = await executeQuery<RouteGroup>(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  // Update route group
  static async update(id: number, data: Partial<CreateRouteGroupData>): Promise<RouteGroup | null> {
    const fields: string[] = [];
    const params: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (fields.length > 0) {
      params.push(id);

      const query = `UPDATE grupos_rotas SET ${fields.join(', ')} WHERE id = ?`;
      await executeSingleQuery(query, params);
    }

    return this.findById(id);
  }

  // List all route groups
  static async findAll(limit?: number): Promise<RouteGroup[]> {
    let query = 'SELECT * FROM grupos_rotas WHERE ativo = TRUE ORDER BY data_criacao DESC';
    const params: any[] = [];
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    return executeQuery<RouteGroup>(query, params);
  }

  // List route groups by driver
  static async findByDriverId(driverId: string): Promise<RouteGroup[]> {
    const query = 'SELECT * FROM grupos_rotas WHERE motorista_id = ? AND ativo = TRUE ORDER BY data_criacao DESC';
    return executeQuery<RouteGroup>(query, [driverId]);
  }

  // Delete route group (soft delete)
  static async delete(id: number): Promise<boolean> {
    const query = 'UPDATE grupos_rotas SET ativo = FALSE WHERE id = ?';
    const result = await executeSingleQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Get statistics
  static async getStats(): Promise<{
    total: number;
    assigned: number;
    unassigned: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN motorista_id IS NOT NULL THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN motorista_id IS NULL THEN 1 ELSE 0 END) as unassigned
      FROM grupos_rotas
      WHERE ativo = TRUE
    `;
    
    const results = await executeQuery<any>(query);
    return results.length > 0 ? results[0] : {
      total: 0,
      assigned: 0,
      unassigned: 0
    };
  }
}
