// Script para testar a importação de arquivos e criação de grupos
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testImport() {
  try {
    console.log('🧪 Testando importação de arquivo...');
    
    // 1. Testar criação de arquivo importado
    console.log('\n1. Criando registro de arquivo importado...');
    const fileResponse = await axios.post(`${API_BASE}/imported-files`, {
      nome_arquivo: 'teste.pdf',
      tipo_arquivo: 'pdf',
      tamanho_bytes: 1024,
      quantidade_registros: 5
    });
    
    console.log('✅ Arquivo importado criado:', fileResponse.data);
    
    // 2. Testar criação de grupo de rotas
    console.log('\n2. Criando grupo de rotas...');
    const routeResponse = await axios.post(`${API_BASE}/route-groups`, {
      nome: 'Centro - Teste',
      cor: '#3B82F6'
    });
    
    console.log('✅ Grupo de rotas criado:', routeResponse.data);
    
    // 3. Listar arquivos importados
    console.log('\n3. Listando arquivos importados...');
    const filesResponse = await axios.get(`${API_BASE}/imported-files`);
    console.log('📄 Arquivos importados:', filesResponse.data);
    
    // 4. Listar grupos de rotas
    console.log('\n4. Listando grupos de rotas...');
    const routesResponse = await axios.get(`${API_BASE}/route-groups`);
    console.log('🚚 Grupos de rotas:', routesResponse.data);
    
    console.log('\n🎉 Todos os testes passaram!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Executar teste
testImport();
