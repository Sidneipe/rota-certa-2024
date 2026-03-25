// Teste simples do backend sem compilação TypeScript
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do banco
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rota_certa',
  charset: 'utf8mb4'
};

// Teste de conexão
async function testConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao MySQL!');
    
    // Testar se as tabelas existem
    const [files] = await connection.execute('SELECT COUNT(*) as count FROM arquivos_importados');
    const [routes] = await connection.execute('SELECT COUNT(*) as count FROM grupos_rotas');
    
    console.log('📄 Arquivos importados:', files[0].count);
    console.log('🚚 Grupos de rotas:', routes[0].count);
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    return false;
  }
}

// Endpoint de teste
app.get('/api/test', async (req, res) => {
  const connected = await testConnection();
  res.json({ 
    status: connected ? 'OK' : 'ERROR',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para criar arquivo importado
app.post('/api/imported-files', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const { nome_arquivo, tipo_arquivo, tamanho_bytes, quantidade_registros } = req.body;
    
    const query = `
      INSERT INTO arquivos_importados (
        nome_arquivo, tipo_arquivo, tamanho_arquivo, quantidade_registros, 
        status_importacao
      ) VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await connection.execute(query, [
      nome_arquivo,
      tipo_arquivo === 'spreadsheet' ? 'xlsx' : tipo_arquivo,
      tamanho_bytes,
      quantidade_registros,
      'completed'
    ]);
    
    console.log('✅ Arquivo importado criado, ID:', result.insertId);
    
    await connection.end();
    
    res.status(201).json({
      id: result.insertId,
      nome_arquivo,
      tipo_arquivo,
      tamanho_bytes,
      quantidade_registros,
      status_importacao: 'completed'
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar arquivo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para listar arquivos
app.get('/api/imported-files', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [files] = await connection.execute('SELECT * FROM arquivos_importados ORDER BY data_importacao DESC');
    
    await connection.end();
    
    res.json(files);
    
  } catch (error) {
    console.error('❌ Erro ao listar arquivos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para criar grupo de rotas
app.post('/api/route-groups', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const { nome, cor } = req.body;
    
    const query = `
      INSERT INTO grupos_rotas (nome, cor) VALUES (?, ?)
    `;
    
    const [result] = await connection.execute(query, [nome, cor]);
    
    console.log('✅ Grupo de rotas criado, ID:', result.insertId);
    
    await connection.end();
    
    res.status(201).json({
      id: result.insertId,
      nome,
      cor,
      ativo: true
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar grupo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para listar grupos
app.get('/api/route-groups', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [routes] = await connection.execute('SELECT * FROM grupos_rotas WHERE ativo = TRUE ORDER BY data_criacao DESC');
    
    await connection.end();
    
    res.json(routes);
    
  } catch (error) {
    console.error('❌ Erro ao listar grupos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor de teste rodando em http://localhost:${PORT}`);
  
  // Testar conexão ao iniciar
  await testConnection();
  
  console.log('\n📋 Endpoints disponíveis:');
  console.log('  GET  /api/test - Testar conexão');
  console.log('  POST /api/imported-files - Criar arquivo');
  console.log('  GET  /api/imported-files - Listar arquivos');
  console.log('  POST /api/route-groups - Criar grupo');
  console.log('  GET  /api/route-groups - Listar grupos');
});
