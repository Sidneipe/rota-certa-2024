USE rota_certa;

CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    papel ENUM('admin', 'operator', 'driver') NOT NULL DEFAULT 'operator',
    driver_id VARCHAR(36) NULL,
    ativo TINYINT(1) DEFAULT 1,
    email_verificado TINYINT(1) DEFAULT 0,
    ultimo_login TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_papel (papel),
    INDEX idx_ativo (ativo),
    INDEX idx_driver_id (driver_id),
    INDEX idx_criado_em (criado_em)
);

INSERT INTO usuarios (id, nome, email, senha, papel, ativo, email_verificado) VALUES 
('admin-001', 'Administrador Sistema', 'admin@rotaflex.com', '$2b$12$LQv3c1yqBWVHxkd0L9TO.YQqYqyKjZvRjGy5uKvX5uG8rMh4K5u', 'admin', 1, 1),
('operator-001', 'Operador Sistema', 'operator@rotaflex.com', '$2b$12$LQv3c1yqBWVHxkd0L9TO.YQqYqyKjZvRjGy5uKvX5uG8rMh4K5u', 'operator', 1, 1),
('driver-001', 'Motorista Sistema', 'driver@rotaflex.com', '$2b$12$LQv3c1yqBWVHxkd0L9TO.YQqYqyKjZvRjGy5uKvX5uG8rMh4K5u', 'driver', 1, 1)
ON DUPLICATE KEY UPDATE 
    nome = VALUES(nome),
    email = VALUES(email),
    senha = VALUES(senha),
    papel = VALUES(papel),
    ativo = VALUES(ativo),
    email_verificado = VALUES(email_verificado);
