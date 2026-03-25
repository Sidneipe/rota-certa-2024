import { executeQuery, executeSingleQuery } from '../config/postgres';
import { v4 as uuidv4 } from 'uuid';

export interface Delivery {
  id: string;
  codigo_rastreio?: string;
  nome_destinatario: string;
  endereco: string;
  numero?: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado?: string;
  cep: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  motorista_id?: string;
  rota_grupo?: number;
  ordem_entrega?: number;
  observacoes?: string;
  dados_brutos?: any;
  arquivo_origem?: string;
  data_importacao?: Date;
  data_entrega?: Date;
  created_at?: Date;
  updated_at?: Date;
}

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

export class DeliveryModel {
  // Create delivery
  static async create(data: CreateDeliveryData): Promise<Delivery> {
    const id = uuidv4();
    const query = `
      INSERT INTO entregas (
        id, codigo_rastreio, nome_destinatario, endereco, numero, complemento,
        bairro, cidade, estado, cep, status, motorista_id, rota_grupo,
        ordem_entrega, observacoes, dados_brutos, arquivo_origem
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      id,
      data.codigo_rastreio || null,
      data.nome_destinatario || 'Sem nome',
      data.endereco,
      data.numero || null,
      data.complemento || null,
      data.bairro,
      data.cidade,
      data.estado || null,
      data.cep,
      data.status || 'pending',
      data.motorista_id || null,
      data.rota_grupo || null,
      data.ordem_entrega || null,
      data.observacoes || null,
      data.dados_brutos ? JSON.stringify(data.dados_brutos) : null,
      data.arquivo_origem || null
    ];

    await executeSingleQuery(query, params);
    return this.findById(id);
  }

  // Find by ID
  static async findById(id: string): Promise<Delivery | null> {
    const query = 'SELECT * FROM entregas WHERE id = ?';
    const results = await executeQuery<Delivery>(query, [id]);
    return results[0] || null;
  }

  // Find all with optional filters
  static async findAll(filters: {
    status?: string;
    motorista_id?: string;
    cidade?: string;
    bairro?: string;
    rota_grupo?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<Delivery[]> {
    let query = 'SELECT * FROM entregas WHERE 1=1';
    const params: any[] = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.motorista_id) {
      query += ' AND motorista_id = ?';
      params.push(filters.motorista_id);
    }

    if (filters.cidade) {
      query += ' AND cidade LIKE ?';
      params.push(`%${filters.cidade}%`);
    }

    if (filters.bairro) {
      query += ' AND bairro LIKE ?';
      params.push(`%${filters.bairro}%`);
    }

    if (filters.rota_grupo) {
      query += ' AND rota_grupo = ?';
      params.push(filters.rota_grupo);
    }

    query += ' ORDER BY data_importacao DESC, created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    return executeQuery<Delivery>(query, params);
  }

  // Update delivery
  static async update(id: string, data: Partial<CreateDeliveryData>): Promise<Delivery | null> {
    const fields: string[] = [];
    const params: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'dados_brutos' && value) {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE entregas SET ${fields.join(', ')} WHERE id = ?`;
    await executeSingleQuery(query, params);
    
    return this.findById(id);
  }

  // Delete delivery
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM entregas WHERE id = ?';
    const result = await executeSingleQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Update status
  static async updateStatus(id: string, status: Delivery['status']): Promise<Delivery | null> {
    const query = `
      UPDATE entregas 
      SET status = ?, 
          data_entrega = CASE WHEN ? = 'delivered' THEN CURRENT_TIMESTAMP ELSE data_entrega END,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    await executeSingleQuery(query, [status, status, id]);
    return this.findById(id);
  }

  // Assign to driver
  static async assignToDriver(id: string, motorista_id: string, rota_grupo?: number, ordem_entrega?: number): Promise<Delivery | null> {
    const query = `
      UPDATE entregas 
      SET motorista_id = ?, 
          rota_grupo = ?, 
          ordem_entrega = ?,
          status = 'in_transit',
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    await executeSingleQuery(query, [motorista_id, rota_grupo || null, ordem_entrega || null, id]);
    return this.findById(id);
  }

  // Get statistics
  static async getStatistics(): Promise<{
    total: number;
    pending: number;
    in_transit: number;
    delivered: number;
    failed: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM entregas
    `;
    
    const results = await executeQuery<any>(query);
    return results[0] || { total: 0, pending: 0, in_transit: 0, delivered: 0, failed: 0 };
  }

  // Find by tracking code
  static async findByTrackingCode(codigo_rastreio: string): Promise<Delivery | null> {
    const query = 'SELECT * FROM entregas WHERE codigo_rastreio = ?';
    const results = await executeQuery<Delivery>(query, [codigo_rastreio]);
    return results[0] || null;
  }

  // Get deliveries by route group
  static async findByRouteGroup(rota_grupo: number): Promise<Delivery[]> {
    const query = 'SELECT * FROM entregas WHERE rota_grupo = ? ORDER BY ordem_entrega ASC, created_at ASC';
    return executeQuery<Delivery>(query, [rota_grupo]);
  }

  // Bulk insert
  static async bulkInsert(deliveries: CreateDeliveryData[]): Promise<number> {
    if (deliveries.length === 0) return 0;

    const query = `
      INSERT INTO entregas (
        id, codigo_rastreio, nome_destinatario, endereco, numero, complemento,
        bairro, cidade, estado, cep, status, motorista_id, rota_grupo,
        ordem_entrega, observacoes, dados_brutos, arquivo_origem
      ) VALUES ${deliveries.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}
    `;

    const params: any[] = [];
    deliveries.forEach(delivery => {
      const id = uuidv4();
      params.push(
        id,
        delivery.codigo_rastreio || null,
        delivery.nome_destinatario || 'Sem nome',
        delivery.endereco,
        delivery.numero || null,
        delivery.complemento || null,
        delivery.bairro,
        delivery.cidade,
        delivery.estado || null,
        delivery.cep,
        delivery.status || 'pending',
        delivery.motorista_id || null,
        delivery.rota_grupo || null,
        delivery.ordem_entrega || null,
        delivery.observacoes || null,
        delivery.dados_brutos ? JSON.stringify(delivery.dados_brutos) : null,
        delivery.arquivo_origem || null
      );
    });

    const result = await executeSingleQuery(query, params);
    return result.affectedRows;
  }
}
