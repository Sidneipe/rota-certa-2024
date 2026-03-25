-- Tabela de usuários para o sistema RotaFlex
-- Adicionar ao schema existente

USE rota_certa;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    papel ENUM('admin', 'operator', 'driver') NOT NULL DEFAULT 'operator',
    driver_id VARCHAR(36) NULL, -- Apenas para motoristas, relaciona com tabela motoristas
    ativo TINYINT(1) DEFAULT 1,
    email_verificado TINYINT(1) DEFAULT 0,
    ultimo_login TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_email (email),
    INDEX idx_papel (papel),
    INDEX idx_ativo (ativo),
    INDEX idx_driver_id (driver_id),
    INDEX idx_criado_em (criado_em)
);

-- Inserir usuários de demonstração
INSERT INTO usuarios (id, nome, email, senha, papel, ativo, email_verificado) VALUES
-- Administrador
('admin-001', 'Administrador Sistema', 'admin@rotaflex.com', '$2b$12$LQv3c1yqBWVHxkd0L9TO.YQqYqyKjZvRjGy5uKvX5uG8rMh4K5u', 'admin', 1, 1),

-- Operador
('operator-001', 'Operador Sistema', 'operator@rotaflex.com', '$2b$12$LQv3c1yqBWVHxkd0L9TO.YQqYqyKjZvRjGy5uKvX5uG8rMh4K5u', 'operator', 1, 1),

-- Motorista
('driver-001', 'Motorista Sistema', 'driver@rotaflex.com', '$2b$12$LQv3c1yqBWVHxkd0L9TO.YQqYqyKjZvRjGy5uKvX5uG8rMh4K5u', 'driver', 1, 1)

ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    email = VALUES(email),
    senha = VALUES(senha),
    papel = VALUES(papel),
    ativo = VALUES(ativo),
    email_verificado = VALUES(email_verificado);

-- Tabela de sessões (opcional, para controle de tokens)
CREATE TABLE IF NOT EXISTS sessoes (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expira_em TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expira_em (expira_em),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id VARCHAR(36) NULL,
    acao VARCHAR(100) NOT NULL,
    tabela VARCHAR(50) NULL,
    registro_id VARCHAR(36) NULL,
    valores_antigos JSON NULL,
    valores_novos JSON NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_acao (acao),
    INDEX idx_tabela (tabela),
    INDEX idx_criado_em (criado_em),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Trigger para registrar alterações em usuários
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_usuarios_update
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
    IF OLD.nome != NEW.nome OR OLD.email != NEW.email OR OLD.papel != NEW.papel OR OLD.ativo != NEW.ativo THEN
        INSERT INTO logs_auditoria (usuario_id, acao, tabela, registro_id, valores_antigos, valores_novos)
        VALUES (
            NEW.id,
            'UPDATE',
            'usuarios',
            NEW.id,
            JSON_OBJECT(
                'nome', OLD.nome,
                'email', OLD.email,
                'papel', OLD.papel,
                'ativo', OLD.ativo
            ),
            JSON_OBJECT(
                'nome', NEW.nome,
                'email', NEW.email,
                'papel', NEW.papel,
                'ativo', NEW.ativo
            )
        );
    END IF;
END//
DELIMITER ;

-- Trigger para registrar criações de usuários
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_usuarios_insert
AFTER INSERT ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO logs_auditoria (usuario_id, acao, tabela, registro_id, valores_novos)
    VALUES (
        NEW.id,
        'INSERT',
        'usuarios',
        NEW.id,
        JSON_OBJECT(
            'nome', NEW.nome,
            'email', NEW.email,
            'papel', NEW.papel,
            'ativo', NEW.ativo
        )
    );
END//
DELIMITER ;

-- Trigger para registrar exclusões de usuários
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_usuarios_delete
AFTER DELETE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO logs_auditoria (usuario_id, acao, tabela, registro_id, valores_antigos)
    VALUES (
        OLD.id,
        'DELETE',
        'usuarios',
        OLD.id,
        JSON_OBJECT(
            'nome', OLD.nome,
            'email', OLD.email,
            'papel', OLD.papel,
            'ativo', OLD.ativo
        )
    );
END//
DELIMITER ;

-- Adicionar coluna usuario_id em tabelas existentes (se necessário)
ALTER TABLE motoristas 
ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(36) NULL AFTER id,
ADD INDEX idx_usuario_id (usuario_id);

ALTER TABLE entregas 
ADD COLUMN IF NOT EXISTS usuario_criacao VARCHAR(36) NULL AFTER id,
ADD COLUMN IF NOT EXISTS usuario_atualizacao VARCHAR(36) NULL AFTER usuario_criacao,
ADD INDEX idx_usuario_criacao (usuario_criacao),
ADD INDEX idx_usuario_atualizacao (usuario_atualizacao);

-- Criar relacionamentos
ALTER TABLE motoristas 
ADD CONSTRAINT fk_motoristas_usuario 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- Inserir usuário para motoristas existentes (se houver)
UPDATE motoristas m 
SET m.usuario_id = (
    SELECT u.id 
    FROM usuarios u 
    WHERE u.email LIKE CONCAT('%', REPLACE(m.nome, ' ', '.'), '%') 
    LIMIT 1
)
WHERE m.usuario_id IS NULL;

-- Exibir resultado
SELECT 'Tabela de usuários criada com sucesso!' AS mensagem;
SELECT COUNT(*) AS total_usuarios FROM usuarios;
SELECT id, nome, email, papel, ativo FROM usuarios;
