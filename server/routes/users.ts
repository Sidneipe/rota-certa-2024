import express from 'express';
import { UserModel, CreateUserData, UpdateUserData } from '../models/User';

const router = express.Router();

// Middleware para validar campos obrigatórios
const validateCreateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { nome, email, senha, papel } = req.body;
  
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
  
  // Validação básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Email inválido'
    });
  }
  
  next();
};

// GET /api/users - Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    console.log('📋 Listando usuários...');
    
    const users = await UserModel.findAll();
    
    // Remover senha do retorno
    const usersWithoutPassword = users.map(user => {
      const { senha, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    console.log(`✅ ${users.length} usuários encontrados`);
    res.json(usersWithoutPassword);
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro ao listar usuários',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/users/role/:papel - Buscar usuários por papel
router.get('/role/:papel', async (req, res) => {
  try {
    const { papel } = req.params;
    
    if (!['admin', 'operator', 'driver'].includes(papel)) {
      return res.status(400).json({
        error: 'Papel inválido. Deve ser: admin, operator ou driver'
      });
    }
    
    console.log(`📋 Buscando usuários com papel: ${papel}`);
    
    const users = await UserModel.findByRole(papel as 'admin' | 'operator' | 'driver');
    
    // Remover senha do retorno
    const usersWithoutPassword = users.map(user => {
      const { senha, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    console.log(`✅ ${users.length} usuários encontrados com papel ${papel}`);
    res.json(usersWithoutPassword);
  } catch (error) {
    console.error('❌ Erro ao buscar usuários por papel:', error);
    res.status(500).json({
      error: 'Erro ao buscar usuários por papel',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/users/:id - Buscar usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 Buscando usuário: ${id}`);
    
    const user = await UserModel.findById(id);
    
    if (!user) {
      console.log(`❌ Usuário não encontrado: ${id}`);
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }
    
    // Remover senha do retorno
    const { senha, ...userWithoutPassword } = user;
    
    console.log(`✅ Usuário encontrado: ${user.nome}`);
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    res.status(500).json({
      error: 'Erro ao buscar usuário',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// POST /api/users - Criar novo usuário
router.post('/', validateCreateUser, async (req, res) => {
  try {
    const userData: CreateUserData = req.body;
    
    console.log('👤 Criando novo usuário:', userData.email);
    
    // Verificar se email já existe
    const emailExists = await UserModel.emailExists(userData.email);
    if (emailExists) {
      console.log(`❌ Email já existe: ${userData.email}`);
      return res.status(400).json({
        error: 'Email já está em uso'
      });
    }
    
    // Criar usuário
    const user = await UserModel.create(userData);
    
    // Remover senha do retorno
    const { senha, ...userWithoutPassword } = user;
    
    console.log(`✅ Usuário criado com sucesso: ${user.nome} (${user.email})`);
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    res.status(500).json({
      error: 'Erro ao criar usuário',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// PUT /api/users/:id - Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: UpdateUserData = req.body;
    
    console.log(`🔄 Atualizando usuário: ${id}`);
    
    // Verificar se usuário existe
    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      console.log(`❌ Usuário não encontrado: ${id}`);
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }
    
    // Verificar se email já existe (se estiver atualizando o email)
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await UserModel.emailExists(updateData.email, id);
      if (emailExists) {
        console.log(`❌ Email já existe: ${updateData.email}`);
        return res.status(400).json({
          error: 'Email já está em uso'
        });
      }
      
      // Validação básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return res.status(400).json({
          error: 'Email inválido'
        });
      }
    }
    
    // Validar senha se fornecida
    if (updateData.senha && updateData.senha.length < 6) {
      return res.status(400).json({
        error: 'A senha deve ter pelo menos 6 caracteres'
      });
    }
    
    // Validar papel se fornecido
    if (updateData.papel && !['admin', 'operator', 'driver'].includes(updateData.papel)) {
      return res.status(400).json({
        error: 'Papel inválido. Deve ser: admin, operator ou driver'
      });
    }
    
    // Atualizar usuário
    const updatedUser = await UserModel.update(id, updateData);
    
    if (!updatedUser) {
      console.log(`❌ Erro ao atualizar usuário: ${id}`);
      return res.status(500).json({
        error: 'Erro ao atualizar usuário'
      });
    }
    
    // Remover senha do retorno
    const { senha, ...userWithoutPassword } = updatedUser;
    
    console.log(`✅ Usuário atualizado: ${updatedUser.nome}`);
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({
      error: 'Erro ao atualizar usuário',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// DELETE /api/users/:id - Desativar usuário
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Desativando usuário: ${id}`);
    
    // Verificar se usuário existe
    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      console.log(`❌ Usuário não encontrado: ${id}`);
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }
    
    // Desativar usuário
    const success = await UserModel.deactivate(id);
    
    if (!success) {
      console.log(`❌ Erro ao desativar usuário: ${id}`);
      return res.status(500).json({
        error: 'Erro ao desativar usuário'
      });
    }
    
    console.log(`✅ Usuário desativado: ${existingUser.nome}`);
    res.json({
      message: 'Usuário desativado com sucesso',
      user: {
        id: existingUser.id,
        nome: existingUser.nome,
        email: existingUser.email
      }
    });
  } catch (error) {
    console.error('❌ Erro ao desativar usuário:', error);
    res.status(500).json({
      error: 'Erro ao desativar usuário',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/users/stats - Estatísticas dos usuários
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Buscando estatísticas dos usuários...');
    
    const stats = await UserModel.countByRole();
    
    console.log('✅ Estatísticas obtidas:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro ao buscar estatísticas',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
