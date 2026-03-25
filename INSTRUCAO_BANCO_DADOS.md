# 🚀 Como Configurar e Usar o Banco de Dados MySQL

## 📋 Resumo da Implementação

Criei um sistema completo de banco de dados MySQL para o seu projeto Rota Certa, incluindo:

### ✅ O que foi implementado:

1. **Banco de Dados MySQL Completo**
   - Schema SQL com todas as tabelas necessárias
   - Índices otimizados para performance
   - Triggers para auditoria automática
   - Views para consultas facilitadas

2. **Backend API com Node.js/Express**
   - Servidor completo na pasta `/server`
   - Models para Motoristas e Entregas
   - Rotas RESTful completas
   - Upload de arquivos
   - Tratamento de erros

3. **Migração Automática**
   - Sistema que migra dados do localStorage para MySQL
   - Fallback para localStorage se MySQL falhar
   - Compatibilidade total com código existente

4. **Serviços Frontend**
   - Cliente API com tratamento de erros
   - Serviços para Motoristas e Entregas
   - Integração transparente com o frontend

## 🛠️ Passos para Configurar

### 1. Instalar MySQL

**Windows:**
```bash
# Baixar MySQL Installer
# https://dev.mysql.com/downloads/installer/
```

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

### 2. Criar o Banco de Dados

```bash
# Conectar ao MySQL
mysql -u root -p

# Executar o script
source database/schema.sql;
```

### 3. Configurar Ambiente

```bash
# Copiar arquivo de configuração
cp server/.env.example server/.env

# Editar o arquivo server/.env com suas credenciais:
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SUA_SENHA_AQUI
DB_NAME=rota_certa
```

```bash
# Copiar configuração do frontend
cp .env.example .env

# Editar o arquivo .env com a URL da API:
VITE_API_URL=http://localhost:3001/api
```

### 4. Instalar Dependências e Iniciar

**Backend:**
```bash
cd server
npm install
npm run dev
```

**Frontend:**
```bash
# Na pasta principal do projeto
npm run dev
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais:

- **`motoristas`** - Dados dos motoristas
- **`motoristas_areas_cobertura`** - Áreas adicionais de cobertura
- **`entregas`** - Todas as entregas do sistema
- **`grupos_rotas`** - Organização das rotas
- **`arquivos_importados`** - Registro de uploads
- **`logs_alteracoes`** - Auditoria de mudanças

### Views Úteis:

- **`vw_estatisticas`** - Estatísticas gerais
- **`vw_motoristas_com_areas`** - Motoristas com áreas
- **`vw_entregas_com_motorista`** - Entregas completas

## 🔄 Como Funciona a Migração

1. **Automática:** Ao carregar o sistema, ele detecta dados no localStorage
2. **Segura:** Migra apenas se o MySQL estiver vazio
3. **Transparente:** Usuário não percebe a migração
4. **Fallback:** Se MySQL falhar, usa localStorage automaticamente

## 🧪 Testar a Integração

### Testar API:

```bash
# Testar saúde do servidor
curl http://localhost:3001/health

# Listar motoristas
curl http://localhost:3001/api/drivers

# Criar motorista
curl -X POST http://localhost:3001/api/drivers \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","cidade":"São Paulo","bairro":"Centro"}'
```

### Testar no Frontend:

1. Abra o sistema no navegador
2. Tente cadastrar um motorista
3. Verifique no console se aparece "Migrando X motoristas..."
4. Os dados devem aparecer no MySQL

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
- `database/schema.sql` - Schema completo do MySQL
- `server/` - Backend completo
- `src/lib/api.ts` - Cliente HTTP
- `src/services/` - Serviços de API
- `README_DATABASE.md` - Documentação completa

### Modificados:
- `src/lib/driverStorage.ts` - Adaptador para MySQL
- `package.json` - Novas dependências

## 🚨 Problemas Comuns

### "Connection refused"
- Verifique se o MySQL está rodando
- Confirme usuário e senha no `.env`

### "Table doesn't exist"
- Execute o script `database/schema.sql`
- Verifique se está usando o banco `rota_certa`

### "CORS error"
- Verifique se o backend está rodando na porta 3001
- Confirme a URL no `.env` do frontend

## 🎯 Próximos Passos

1. **Teste Completo:** Verifique todas as funcionalidades
2. **Backup:** Faça backup regular do banco
3. **Produção:** Configure senhas fortes e SSL
4. **Monitoramento:** Adicione logs e métricas

## 📞 Suporte

Se tiver algum problema:

1. Verifique os logs do servidor (terminal)
2. Confirme as configurações nos arquivos `.env`
3. Teste a conexão com o MySQL diretamente
4. Consulte o `README_DATABASE.md` para detalhes

---

**O sistema está pronto para usar!** 🎉

O banco de dados MySQL foi completamente integrado ao seu sistema Rota Certa, com migração automática e fallback para garantir que nenhum dado seja perdido.
