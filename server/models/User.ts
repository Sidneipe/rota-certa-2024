import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { executeQuery, executeSingleQuery } from '../config/postgres';

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
  senha: string;
  papel: 'admin' | 'operator' | 'driver';
  driver_id?: string;
  ativo: boolean;
  email_verificado: boolean;
  ultimo_login?: string;
  criado_em: string;
  atualizado_em: string;
}

export class UserModel {
  // Criar novo usuário
  static async create(userData: CreateUserData): Promise<User> {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(userData.senha, 10);
    
    const query = `
      INSERT INTO usuarios (id, nome, email, senha, papel, driver_id, ativo, email_verificado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      id,
      userData.nome,
      userData.email,
      hashedPassword,
      userData.papel,
      userData.driver_id || null,
      true,
      false
    ];
    
    await executeSingleQuery(query, params);
    
    const user = await this.findById(id);
    if (!user) {
      throw new Error('Erro ao criar usuário');
    }
    
    return user;
  }
  
  // Buscar usuário por ID
  static async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM usuarios WHERE id = ? AND ativo = true';
    const results = await executeQuery(query, [id]);
    
    if (results.length === 0) return null;
    
    return results[0] as User;
  }
  
  // Buscar usuário por email
  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM usuarios WHERE email = ? AND ativo = true';
    const results = await executeQuery(query, [email]);
    
    if (results.length === 0) return null;
    
    return results[0] as User;
  }
  
  // Listar todos os usuários
  static async findAll(): Promise<User[]> {
    const query = 'SELECT * FROM usuarios WHERE ativo = true ORDER BY criado_em DESC';
    const results = await executeQuery(query);
    
    return results as User[];
  }
  
  // Atualizar usuário
  static async update(id: string, data: UpdateUserData): Promise<User | null> {
    const fields: string[] = [];
    const params: any[] = [];
    
    // Atualizar campos básicos
    if (data.nome !== undefined) {
      fields.push('nome = ?');
      params.push(data.nome);
    }
    
    if (data.email !== undefined) {
      fields.push('email = ?');
      params.push(data.email);
    }
    
    if (data.senha !== undefined) {
      const hashedPassword = await bcrypt.hash(data.senha, 10);
      fields.push('senha = ?');
      params.push(hashedPassword);
    }
    
    if (data.papel !== undefined) {
      fields.push('papel = ?');
      params.push(data.papel);
    }
    
    if (data.driver_id !== undefined) {
      fields.push('driver_id = ?');
      params.push(data.driver_id);
    }
    
    if (data.ativo !== undefined) {
      fields.push('ativo = ?');
      params.push(data.ativo);
    }
    
    if (fields.length > 0) {
      fields.push('atualizado_em = CURRENT_TIMESTAMP');
      params.push(id);
      
      const query = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;
      await executeSingleQuery(query, params);
    }
    
    return this.findById(id);
  }
  
  // Desativar usuário (soft delete)
  static async deactivate(id: string): Promise<boolean> {
    const query = 'UPDATE usuarios SET ativo = false, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await executeSingleQuery(query, [id]);
    
    return result.affectedRows > 0;
  }
  
  // Verificar senha
  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.senha);
  }
  
  // Atualizar último login
  static async updateLastLogin(id: string): Promise<void> {
    const query = 'UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ?';
    await executeSingleQuery(query, [id]);
  }
  
  // Contar usuários por papel
  static async countByRole(): Promise<{ papel: string; total: number }[]> {
    const query = `
      SELECT papel, COUNT(*) as total 
      FROM usuarios 
      WHERE ativo = true 
      GROUP BY papel
    `;
    
    const results = await executeQuery(query);
    return results as { papel: string; total: number }[];
  }
  
  // Buscar usuários por papel
  static async findByRole(papel: 'admin' | 'operator' | 'driver'): Promise<User[]> {
    const query = 'SELECT * FROM usuarios WHERE papel = ? AND ativo = true ORDER BY nome ASC';
    const results = await executeQuery(query, [papel]);
    
    return results as User[];
  }
  
  // Verificar se email já existe
  static async emailExists(email: string, excludeId?: string): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM usuarios WHERE email = ? AND ativo = true';
    let params = [email];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const results = await executeQuery(query, params);
    return (results[0] as any).count > 0;
  }
}
