const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

const app = express();
const PORT = 3002; // Forçando porta 3002

// Configuração CORS
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rota_certa',
  charset: 'utf8mb4'
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Funções auxiliares do banco
async function executeQuery(query, params = []) {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } finally {
    await connection.end();
  }
}

// Rotas de usuários
app.get('/api/users', async (req, res) => {
  try {
    console.log('📋 Listando usuários...');
    const users = await executeQuery('SELECT id, nome, email, papel, driver_id, ativo, email_verificado, ultimo_login, criado_em, atualizado_em FROM usuarios WHERE ativo = 1 ORDER BY criado_em DESC');
    console.log(`✅ ${users.length} usuários encontrados`);
    res.json(users);
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro ao listar usuários',
      details: error.message
    });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { nome, email, senha, papel, driver_id } = req.body;
    
    console.log('👤 Criando novo usuário:', email);
    
    // Validações básicas
    if (!nome || !email || !senha || !papel) {
      return res.status(400).json({
        error: 'Campos obrigatórios: nome, email, senha, papel'
      });
    }
    
    if (!['admin', 'operator', 'driver'].includes(papel)) {
      return res.status(400).json({
        error: 'Papel inválido. Deve ser: admin, operator ou driver'
      });
    }
    
    if (senha.length < 6) {
      return res.status(400).json({
        error: 'A senha deve ter pelo menos 6 caracteres'
      });
    }
    
    // Verificar se email já existe
    const existingUsers = await executeQuery('SELECT COUNT(*) as count FROM usuarios WHERE email = ? AND ativo = 1', [email]);
    if (existingUsers[0].count > 0) {
      return res.status(400).json({
        error: 'Email já está em uso'
      });
    }
    
    // Criar usuário
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(senha, 10);
    
    await executeQuery(
      'INSERT INTO usuarios (id, nome, email, senha, papel, driver_id, ativo, email_verificado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, nome, email, hashedPassword, papel, driver_id || null, 1, 0]
    );
    
    // Buscar usuário criado
    const users = await executeQuery('SELECT id, nome, email, papel, driver_id, ativo, email_verificado, ultimo_login, criado_em, atualizado_em FROM usuarios WHERE id = ?', [id]);
    
    console.log(`✅ Usuário criado com sucesso: ${nome} (${email})`);
    res.status(201).json(users[0]);
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    res.status(500).json({
      error: 'Erro ao criar usuário',
      details: error.message
    });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, papel, driver_id, ativo } = req.body;
    
    console.log(`🔄 Atualizando usuário: ${id}`);
    
    // Verificar se usuário existe
    const existingUsers = await executeQuery('SELECT * FROM usuarios WHERE id = ? AND ativo = 1', [id]);
    if (existingUsers.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }
    
    // Construir query dinâmica
    const fields = [];
    const params = [];
    
    if (nome !== undefined) {
      fields.push('nome = ?');
      params.push(nome);
    }
    
    if (email !== undefined) {
      // Verificar se email já existe (se for diferente)
      if (email !== existingUsers[0].email) {
        const emailCheck = await executeQuery('SELECT COUNT(*) as count FROM usuarios WHERE email = ? AND id != ? AND ativo = 1', [email, id]);
        if (emailCheck[0].count > 0) {
          return res.status(400).json({
            error: 'Email já está em uso'
          });
        }
      }
      fields.push('email = ?');
      params.push(email);
    }
    
    if (senha !== undefined) {
      const hashedPassword = await bcrypt.hash(senha, 10);
      fields.push('senha = ?');
      params.push(hashedPassword);
    }
    
    if (papel !== undefined) {
      if (!['admin', 'operator', 'driver'].includes(papel)) {
        return res.status(400).json({
          error: 'Papel inválido. Deve ser: admin, operator ou driver'
        });
      }
      fields.push('papel = ?');
      params.push(papel);
    }
    
    if (driver_id !== undefined) {
      fields.push('driver_id = ?');
      params.push(driver_id);
    }
    
    if (ativo !== undefined) {
      fields.push('ativo = ?');
      params.push(ativo ? 1 : 0);
    }
    
    if (fields.length > 0) {
      fields.push('atualizado_em = CURRENT_TIMESTAMP');
      params.push(id);
      
      const query = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;
      await executeQuery(query, params);
    }
    
    // Buscar usuário atualizado
    const updatedUsers = await executeQuery('SELECT id, nome, email, papel, driver_id, ativo, email_verificado, ultimo_login, criado_em, atualizado_em FROM usuarios WHERE id = ?', [id]);
    
    console.log(`✅ Usuário atualizado: ${updatedUsers[0].nome}`);
    res.json(updatedUsers[0]);
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({
      error: 'Erro ao atualizar usuário',
      details: error.message
    });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Desativando usuário: ${id}`);
    
    // Verificar se usuário existe
    const existingUsers = await executeQuery('SELECT * FROM usuarios WHERE id = ? AND ativo = 1', [id]);
    if (existingUsers.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }
    
    // Desativar usuário
    await executeQuery('UPDATE usuarios SET ativo = 0, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    
    console.log(`✅ Usuário desativado: ${existingUsers[0].nome}`);
    res.json({
      message: 'Usuário desativado com sucesso',
      user: {
        id: existingUsers[0].id,
        nome: existingUsers[0].nome,
        email: existingUsers[0].email
      }
    });
  } catch (error) {
    console.error('❌ Erro ao desativar usuário:', error);
    res.status(500).json({
      error: 'Erro ao desativar usuário',
      details: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('✅ Conexão com MySQL estabelecida com sucesso');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log('🔧 Development mode enabled');
  console.log('🌐 CORS enabled for: http://localhost:8080');
});

module.exports = app;
