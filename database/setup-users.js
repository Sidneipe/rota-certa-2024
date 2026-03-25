const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rota_certa',
  charset: 'utf8mb4',
  multipleStatements: true // Permitir múltiplas instruções SQL
};

async function setupUsers() {
  let connection;
  
  try {
    console.log('🔧 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado com sucesso!');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'create_users_simple.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executando script SQL...');
    
    // Executar o script completo de uma vez (sem USE)
    const sqlWithoutUse = sqlContent.replace('USE rota_certa;', '');
    await connection.query(sqlWithoutUse);
    
    console.log('✅ Script SQL executado com sucesso!');
    
    // Verificar se a tabela foi criada
    const [tableCheck] = await connection.execute("SHOW TABLES LIKE 'usuarios'");
    if (tableCheck.length > 0) {
      console.log('✅ Tabela "usuarios" criada com sucesso!');
      
      // Contar usuários
      const [userCount] = await connection.execute('SELECT COUNT(*) as total FROM usuarios');
      console.log(`👥 Total de usuários: ${userCount[0].total}`);
      
      // Mostrar usuários inseridos
      const [users] = await connection.execute('SELECT id, nome, email, papel FROM usuarios');
      console.log('\n👥 Usuários criados:');
      console.table(users);
    } else {
      console.log('❌ Tabela "usuarios" não foi criada');
    }
    
    console.log('\n✅ Script executado com sucesso!');
    
    // Verificar se a tabela foi criada
    const [tables] = await connection.execute("SHOW TABLES LIKE 'usuarios'");
    if (tables.length > 0) {
      console.log('\n🎉 Tabela "usuarios" criada com sucesso!');
      
      // Mostrar usuários inseridos
      const [users] = await connection.execute('SELECT id, nome, email, papel, ativo FROM usuarios');
      console.log('\n👥 Usuários criados:');
      console.table(users);
      
      console.log('\n🔐 Senhas para teste:');
      console.log('┌─────────────┬──────────────────────┬─────────┐');
      console.log('│ Email       │ Senha             │ Papel   │');
      console.log('├─────────────┼──────────────────────┼─────────┤');
      console.log('│ admin@rotaflex.com │ admin123        │ Admin   │');
      console.log('│ operator@rotaflex.com │ operator123     │ Operador │');
      console.log('│ driver@rotaflex.com  │ driver123        │ Motorista│');
      console.log('└─────────────┴──────────────────────┴─────────┘');
    } else {
      console.log('\n❌ Erro: Tabela "usuarios" não foi criada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar script:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🔒 Erro de acesso ao banco. Verifique:');
      console.log('1. Se o MySQL está rodando');
      console.log('2. Se as credenciais estão corretas');
      console.log('3. Se o usuário tem permissão para criar tabelas');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n🔌 MySQL não está rodando ou porta incorreta');
      console.log('Inicie o MySQL e tente novamente');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão encerrada');
    }
  }
}

// Função para verificar se o MySQL está rodando
async function checkMySQL() {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await connection.ping();
    await connection.end();
    return true;
  } catch (error) {
    return false;
  }
}

// Executar setup
async function main() {
  console.log('🚀 Configurando tabela de usuários para RotaFlex');
  console.log('=' .repeat(50));
  
  // Verificar se o MySQL está rodando
  const isMySQLRunning = await checkMySQL();
  if (!isMySQLRunning) {
    console.log('❌ MySQL não está rodando!');
    console.log('\n📋 Instruções:');
    console.log('1. Inicie o MySQL/XAMPP/WAMP');
    console.log('2. Verifique se a porta 3306 está disponível');
    console.log('3. Execute este script novamente');
    process.exit(1);
  }
  
  await setupUsers();
}

// Tratar erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erro não tratado:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
  process.exit(1);
});

// Executar
main();
