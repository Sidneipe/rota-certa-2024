# Banco de Dados MySQL - Rota Certa

Este documento descreve como configurar e usar o banco de dados MySQL para o sistema Rota Certa.

## 📋 Estrutura do Banco de Dados

### Tabelas Principais

#### `motoristas`
Armazena informações dos motoristas do sistema.

**Campos:**
- `id` (UUID) - Identificador único
- `nome` (VARCHAR) - Nome completo do motorista
- `telefone` (VARCHAR) - Telefone de contato
- `veiculo` (VARCHAR) - Tipo de veículo (Moto, Van, Carro, etc.)
- `placa` (VARCHAR) - Placa do veículo
- `cidade` (VARCHAR) - Cidade de residência
- `bairro` (VARCHAR) - Bairro de residência
- `estado` (VARCHAR) - Estado (UF)
- `ativo` (BOOLEAN) - Status do motorista
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data da última atualização

#### `motoristas_areas_cobertura`
Áreas adicionais que o motorista pode atender além da residência.

**Campos:**
- `id` (AUTO_INCREMENT) - Identificador único
- `motorista_id` (UUID) - Referência ao motorista
- `cidade` (VARCHAR) - Cidade da área de cobertura
- `bairro` (VARCHAR) - Bairro da área de cobertura
- `estado` (VARCHAR) - Estado (UF)
- `created_at` (TIMESTAMP) - Data de criação

#### `entregas`
Registros de todas as entregas do sistema.

**Campos:**
- `id` (UUID) - Identificador único
- `codigo_rastreio` (VARCHAR) - Código de rastreamento
- `nome_destinatario` (VARCHAR) - Nome do destinatário
- `endereco` (VARCHAR) - Endereço de entrega
- `numero` (VARCHAR) - Número do endereço
- `complemento` (VARCHAR) - Complemento
- `bairro` (VARCHAR) - Bairro de entrega
- `cidade` (VARCHAR) - Cidade de entrega
- `estado` (VARCHAR) - Estado (UF)
- `cep` (VARCHAR) - CEP
- `status` (ENUM) - Status da entrega
- `motorista_id` (UUID) - Motorista responsável
- `rota_grupo` (INT) - Grupo da rota
- `ordem_entrega` (INT) - Ordem na rota
- `observacoes` (TEXT) - Observações
- `dados_brutos` (JSON) - Dados originais do arquivo
- `arquivo_origem` (VARCHAR) - Nome do arquivo original
- `data_importacao` (TIMESTAMP) - Data de importação
- `data_entrega` (TIMESTAMP) - Data de entrega
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data da última atualização

#### `grupos_rotas`
Grupos de rotas para organização das entregas.

**Campos:**
- `id` (AUTO_INCREMENT) - Identificador único
- `nome` (VARCHAR) - Nome do grupo
- `cor` (VARCHAR) - Cor para identificação visual
- `motorista_id` (UUID) - Motorista responsável
- `data_criacao` (TIMESTAMP) - Data de criação
- `ativo` (BOOLEAN) - Status do grupo

#### `arquivos_importados`
Registro dos arquivos importados.

**Campos:**
- `id` (AUTO_INCREMENT) - Identificador único
- `nome_arquivo` (VARCHAR) - Nome do arquivo
- `tipo_arquivo` (ENUM) - Tipo do arquivo
- `tamanho_arquivo` (BIGINT) - Tamanho em bytes
- `quantidade_registros` (INT) - Quantidade de registros
- `data_importacao` (TIMESTAMP) - Data de importação
- `status_importacao` (ENUM) - Status da importação
- `erro_importacao` (TEXT) - Erro ocorrido

#### `logs_alteracoes`
Auditoria de alterações no sistema.

**Campos:**
- `id` (AUTO_INCREMENT) - Identificador único
- `tabela` (VARCHAR) - Nome da tabela alterada
- `registro_id` (VARCHAR) - ID do registro
- `tipo_operacao` (ENUM) - Tipo de operação
- `dados_antigos` (JSON) - Valores anteriores
- `dados_novos` (JSON) - Novos valores
- `usuario` (VARCHAR) - Usuário que realizou
- `data_alteracao` (TIMESTAMP) - Data da alteração

### Views

#### `vw_estatisticas`
Estatísticas gerais do sistema.

#### `vw_motoristas_com_areas`
Motoristas com suas áreas de cobertura agregadas.

#### `vw_entregas_com_motorista`
Entregas com informações do motorista e grupo de rota.

## 🚀 Configuração

### 1. Instalar MySQL

**Windows:**
```bash
# Baixar e instalar MySQL Installer
# https://dev.mysql.com/downloads/installer/
```

**macOS:**
```bash
# Usar Homebrew
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 2. Criar Banco de Dados

```bash
# Conectar ao MySQL
mysql -u root -p

# Executar script de criação
source database/schema.sql;
```

### 3. Configurar Ambiente

Copiar o arquivo de ambiente:

```bash
cp server/.env.example server/.env
```

Editar o arquivo `server/.env`:

```env
# Configuração do Banco de Dados MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=rota_certa

# Configuração do Servidor
PORT=3001
NODE_ENV=development

# Configuração de CORS
FRONTEND_URL=http://localhost:5173

# Configuração de Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

## 🔧 Uso

### Iniciar Servidor Backend

```bash
# Entrar na pasta do servidor
cd server

# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev

# Ou compilar e iniciar em produção
npm run build
npm start
```

### Testar Conexão

O servidor irá testar a conexão com o banco automaticamente ao iniciar. Você também pode testar manualmente:

```bash
# Acessar endpoint de saúde
curl http://localhost:3001/health
```

## 📊 Exemplos de Uso

### Criar Motorista

```bash
curl -X POST http://localhost:3001/api/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "telefone": "(11) 98765-4321",
    "veiculo": "Moto",
    "placa": "ABC-1234",
    "cidade": "São Paulo",
    "bairro": "Vila Mariana",
    "estado": "SP",
    "coverageAreas": [
      {"cidade": "São Paulo", "bairro": "Moema", "estado": "SP"},
      {"cidade": "São Paulo", "bairro": "Itaim Bibi", "estado": "SP"}
    ]
  }'
```

### Listar Motoristas

```bash
curl http://localhost:3001/api/drivers
```

### Criar Entrega

```bash
curl -X POST http://localhost:3001/api/deliveries \
  -H "Content-Type: application/json" \
  -d '{
    "codigo_rastreio": "BR123456789",
    "nome_destinatario": "Maria Santos",
    "endereco": "Rua das Flores",
    "numero": "123",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567"
  }'
```

### Upload de Arquivo

```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@/caminho/do/arquivo.xlsx"
```

## 🛠️ Manutenção

### Backup do Banco

```bash
mysqldump -u root -p rota_certa > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar Backup

```bash
mysql -u root -p rota_certa < backup_20231201_120000.sql
```

### Limpar Dados de Teste

```sql
-- Limpar todos os dados (cuidado!)
DELETE FROM logs_alteracoes;
DELETE FROM motoristas_areas_cobertura;
DELETE FROM entregas;
DELETE FROM grupos_rotas;
DELETE FROM motoristas;
DELETE FROM arquivos_importados;

-- Resetar auto increment
ALTER TABLE motoristas_areas_cobertura AUTO_INCREMENT = 1;
ALTER TABLE grupos_rotas AUTO_INCREMENT = 1;
ALTER TABLE arquivos_importados AUTO_INCREMENT = 1;
ALTER TABLE logs_alteracoes AUTO_INCREMENT = 1;
```

## 🔍 Consultas Úteis

### Motoristas por Cidade

```sql
SELECT cidade, COUNT(*) as total_motoristas
FROM motoristas
WHERE ativo = 1
GROUP BY cidade
ORDER BY total_motoristas DESC;
```

### Entregas por Status

```sql
SELECT 
  status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM entregas), 2) as percentual
FROM entregas
GROUP BY status;
```

### Entregas por Mês

```sql
SELECT 
  DATE_FORMAT(data_importacao, '%Y-%m') as mes,
  COUNT(*) as total_entregas
FROM entregas
GROUP BY DATE_FORMAT(data_importacao, '%Y-%m')
ORDER BY mes DESC;
```

## 🚨 Segurança

### Recomendações

1. **Senha do MySQL:** Use senhas fortes para o usuário do banco
2. **Permissões:** Crie um usuário específico para a aplicação com permissões limitadas
3. **SSL:** Configure SSL para conexões com o banco em produção
4. **Backup:** Faça backups regulares do banco de dados
5. **Monitoramento:** Monitore logs e performance do banco

### Exemplo de Usuário Específico

```sql
CREATE USER 'rota_certa_app'@'localhost' IDENTIFIED BY 'senha_forte_aqui';
GRANT SELECT, INSERT, UPDATE, DELETE ON rota_certa.* TO 'rota_certa_app'@'localhost';
FLUSH PRIVILEGES;
```

## 📝 Problemas Comuns

### Conexão Recusada
- Verifique se o MySQL está rodando
- Confirme usuário e senha
- Verifique se o banco existe

### Erro de Permissão
- Confirme se o usuário tem permissões nas tabelas
- Verifique se as tabelas existem

### Performance
- Adicione índices nas colunas usadas em filtros
- Monitore consultas lentas
- Considere particionamento para tabelas grandes
