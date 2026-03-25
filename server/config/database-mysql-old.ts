import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
}

const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rota_certa',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(config);

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Conexão com MySQL estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MySQL:', error);
    return false;
  }
}

// Execute query with error handling
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<T[]> {
  try {
    const [rows] = await pool.execute(query, params);
    return rows as T[];
  } catch (error) {
    console.error('Erro na consulta SQL:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

// Execute single query (INSERT, UPDATE, DELETE)
export async function executeSingleQuery(
  query: string, 
  params: any[] = []
): Promise<mysql.ResultSetHeader> {
  try {
    const [result] = await pool.execute(query, params);
    return result as mysql.ResultSetHeader;
  } catch (error) {
    console.error('Erro na consulta SQL:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

// Transaction helper
export async function executeTransaction<T = any>(
  queries: Array<{ query: string; params?: any[] }>
): Promise<T[]> {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results: T[] = [];
    for (const { query, params = [] } of queries) {
      const [rows] = await connection.execute(query, params);
      results.push(rows as T);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    console.error('Erro na transação:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Close pool
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('Pool de conexões fechado');
  } catch (error) {
    console.error('Erro ao fechar pool:', error);
  }
}

export default pool;
