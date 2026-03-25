# 🗄️ Banco de Dados - RotaFlex

## 📋 Estrutura

Este diretório contém os scripts SQL e utilitários para configurar o banco de dados do sistema RotaFlex.

## 🚀 Configuração Rápida

### Pré-requisitos
- MySQL 5.7+ ou MariaDB 10.2+
- Node.js 14+ (para scripts de automação)
- Acesso de administrador ao MySQL

### Método 1: Script Automático (Recomendado)

```bash
# Entrar no diretório do database
cd database

# Instalar dependências (se necessário)
npm install

# Executar script de configuração
npm run setup
```

### Método 2: Manual via MySQL

```bash
# Conectar ao MySQL
mysql -u root -p

# Selecionar database
USE rota_certa;

# Executar script
SOURCE create_users_table.sql;
```

## 📊 Tabelas Criadas

### `usuarios`
Tabela principal de usuários do sistema.

**Campos:**
- `id`: UUID do usuário
- `nome`: Nome completo
- `email`: Email único
- `senha`: Hash da senha (bcrypt)
- `papel`: ENUM (admin, operator, driver)
- `driver_id`: Relação com motoristas (apenas para motoristas)
- `ativo`: Status do usuário
- `email_verificado`: Se email foi verificado
- `ultimo_login`: Último acesso
- `criado_em`: Data de criação
- `atualizado_em`: Última atualização

### `sessoes`
Controle de sessões ativas (opcional).

**Campos:**
- `id`: UUID da sessão
- `usuario_id`: ID do usuário
- `token_hash`: Hash do token JWT
- `expira_em`: Data de expiração
- `ip_address`: IP de origem
- `user_agent`: Browser/cliente

### `logs_auditoria`
Registro de todas as alterações no sistema.

**Campos:**
- `id`: Auto incremento
- `usuario_id`: ID do usuário que fez a ação
- `acao`: Tipo de ação (INSERT, UPDATE, DELETE)
- `tabela`: Tabela afetada
- `registro_id`: ID do registro alterado
- `valores_antigos`: JSON com valores anteriores
- `valores_novos`: JSON com novos valores
- `ip_address`: IP de origem
- `user_agent`: Browser/cliente
- `criado_em`: Data do log

## 👥 Usuários de Demonstração

O script cria automaticamente 3 usuários:

| Email | Senha | Papel | Permissões |
|-------|--------|--------|-------------|
| admin@rotaflex.com | admin123 | Administrador | Total |
| operator@rotaflex.com | operator123 | Operador | Entregas, Rotas |
| driver@rotaflex.com | driver123 | Motorista | Visualizar rotas |

## 🔐 Segurança

### Hash de Senhas
As senhas são hasheadas usando bcrypt com salt:
- **Algoritmo:** bcrypt
- **Rounds:** 12
- **Exemplo:** `$2b$12$LQv3c1yqBWVHxkd0L9TO.YQqYqyKjZvRjGy5uKvX5uG8rMh4K5u`

### Triggers de Auditoria
- **INSERT:** Registra criações
- **UPDATE:** Registra alterações
- **DELETE:** Registra exclusões

### Índices Otimizados
- `idx_email`: Busca por email (único)
- `idx_papel`: Filtrar por papel
- `idx_ativo`: Usuários ativos
- `idx_driver_id`: Relação com motoristas

## 🛠️ Scripts Disponíveis

```bash
# Instalar dependências do database
npm install

# Executar configuração completa
npm run setup

# Criar apenas as tabelas (manual)
npm run create-tables

# Verificar conexão com MySQL
npm run check
```

## 📝 Comandos Úteis

### Verificar tabelas criadas:
```sql
SHOW TABLES;
DESCRIBE usuarios;
DESCRIBE sessoes;
DESCRIBE logs_auditoria;
```

### Listar usuários:
```sql
SELECT id, nome, email, papel, ativo, DATE_FORMAT(criado_em, '%d/%m/%Y') AS criado_em 
FROM usuarios 
ORDER BY criado_em DESC;
```

### Ver logs de auditoria:
```sql
SELECT 
    u.nome,
    acao,
    tabela,
    DATE_FORMAT(l.criado_em, '%d/%m/%Y %H:%i') AS data
FROM logs_auditoria l
LEFT JOIN usuarios u ON l.usuario_id = u.id
ORDER BY l.criado_em DESC 
LIMIT 50;
```

### Resetar usuários de demonstração:
```sql
UPDATE usuarios SET 
    senha = '$2b$12$LQv3c1yqBWVHxkd0L9TO.YQqYqyKjZvRjGy5uKvX5uG8rMh4K5u',
    ultimo_login = NULL
WHERE email IN ('admin@rotaflex.com', 'operator@rotaflex.com', 'driver@rotaflex.com');
```

## 🔧 Personalização

### Adicionar Novos Usuários:
```sql
INSERT INTO usuarios (id, nome, email, senha, papel) VALUES
('UUID()', 'Novo Usuário', 'novo@exemplo.com', '$2b$12$LQv3c1yqBWVHxkd0L9TO.YQqYqyKjZvRjGy5uKvX5uG8rMh4K5u', 'operator');
```

### Alterar Senha:
```sql
UPDATE usuarios 
SET senha = '$2b$12$LQv3c1yqBWVHxkd0L9TO.YQqYqyKjZvRjGy5uKvX5uG8rMh4K5u'
WHERE email = 'usuario@exemplo.com';
```

## 🚨 Solução de Problemas

### Erro: "Access denied"
```bash
# Verifique se o MySQL está rodando com as credenciais corretas
mysql -u root -p
```

### Erro: "Table doesn't exist"
```bash
# Execute novamente o script de criação
npm run setup
```

### Erro: "Connection refused"
```bash
# Inicie o MySQL/XAMPP/WAMP
# Verifique se a porta 3306 está disponível
netstat -an | grep 3306
```

## 📈 Performance

### Recomendações:
- **Índices:** Já configurados nos campos principais
- **Particionamento:** Considerar para logs (mensal)
- **Backup:** Automatizar backup diário
- **Limpeza:** Remover sessões expiradas

### Backup Automático:
```sql
-- Criar backup da tabela de usuários
CREATE TABLE usuarios_backup AS SELECT * FROM usuarios;

-- Exportar dados
mysqldump -u root -p rota_certa usuarios > usuarios_backup.sql
```

---

**🎯 Pronto para uso! Execute `npm run setup` para configurar.**
