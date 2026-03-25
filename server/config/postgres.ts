import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', error);
    return false;
  }
}

// Execute query with error handling
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<T[]> {
  try {
    const client = await pool.connect();
    const result = await client.query(query, params);
    client.release();
    return result.rows;
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
): Promise<any> {
  try {
    const client = await pool.connect();
    const result = await client.query(query, params);
    client.release();
    return result;
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
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const results: T[] = [];
    for (const { query, params = [] } of queries) {
      const result = await client.query(query, params);
      results.push(result.rows);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro na transação:', error);
    throw error;
  } finally {
    client.release();
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
