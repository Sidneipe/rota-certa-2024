-- Banco de dados para o sistema Rota Certa
-- Sistema de gerenciamento de entregas e motoristas

CREATE DATABASE IF NOT EXISTS rota_certa 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE rota_certa;

-- Tabela de motoristas
CREATE TABLE motoristas (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    veiculo VARCHAR(100),
    placa VARCHAR(20),
    cidade VARCHAR(100) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    estado VARCHAR(2),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nome (nome),
    INDEX idx_cidade (cidade),
    INDEX idx_ativo (ativo),
    INDEX idx_created_at (created_at)
);

-- Tabela de áreas de cobertura dos motoristas
CREATE TABLE motoristas_areas_cobertura (
    id INT AUTO_INCREMENT PRIMARY KEY,
    motorista_id VARCHAR(36) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    estado VARCHAR(2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (motorista_id) REFERENCES motoristas(id) ON DELETE CASCADE,
    INDEX idx_motorista_id (motorista_id),
    INDEX idx_cidade_bairro (cidade, bairro)
);

-- Tabela de entregas
CREATE TABLE entregas (
    id VARCHAR(36) PRIMARY KEY,
    codigo_rastreio VARCHAR(100),
    nome_destinatario VARCHAR(255) NOT NULL DEFAULT 'Sem nome',
    endereco VARCHAR(255) NOT NULL,
    numero VARCHAR(20),
    complemento VARCHAR(255),
    bairro VARCHAR(100) NOT NULL DEFAULT 'Sem bairro',
    cidade VARCHAR(100) NOT NULL DEFAULT 'Sem cidade',
    estado VARCHAR(2),
    cep VARCHAR(10),
    status ENUM('pending', 'in_transit', 'delivered', 'failed') DEFAULT 'pending',
    motorista_id VARCHAR(36),
    rota_grupo INT,
    ordem_entrega INT,
    observacoes TEXT,
    dados_brutos JSON,
    arquivo_origem VARCHAR(255),
    data_importacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_entrega TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (motorista_id) REFERENCES motoristas(id) ON DELETE SET NULL,
    INDEX idx_codigo_rastreio (codigo_rastreio),
    INDEX idx_status (status),
    INDEX idx_motorista_id (motorista_id),
    INDEX idx_rota_grupo (rota_grupo),
    INDEX idx_cidade_bairro (cidade, bairro),
    INDEX idx_cep (cep),
    INDEX idx_data_importacao (data_importacao)
);

-- Tabela de grupos de rotas
CREATE TABLE grupos_rotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cor VARCHAR(20) DEFAULT '#3B82F6',
    motorista_id VARCHAR(36),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (motorista_id) REFERENCES motoristas(id) ON DELETE SET NULL,
    INDEX idx_motorista_id (motorista_id),
    INDEX idx_data_criacao (data_criacao),
    INDEX idx_ativo (ativo)
);

-- Tabela de arquivos importados
CREATE TABLE arquivos_importados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo ENUM('pdf', 'xlsx', 'xls', 'csv') NOT NULL,
    tamanho_arquivo BIGINT,
    quantidade_registros INT DEFAULT 0,
    data_importacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_importacao ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
    erro_importacao TEXT,
    
    INDEX idx_data_importacao (data_importacao),
    INDEX idx_status_importacao (status_importacao)
);

-- Tabela de log de alterações (audit trail)
CREATE TABLE logs_alteracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tabela VARCHAR(50) NOT NULL,
    registro_id VARCHAR(36) NOT NULL,
    tipo_operacao ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    dados_antigos JSON,
    dados_novos JSON,
    usuario VARCHAR(100),
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tabela_registro (tabela, registro_id),
    INDEX idx_data_alteracao (data_alteracao),
    INDEX idx_tipo_operacao (tipo_operacao)
);

-- Trigger para log de alterações na tabela motoristas
DELIMITER //
CREATE TRIGGER motoristas_after_insert
AFTER INSERT ON motoristas
FOR EACH ROW
BEGIN
    INSERT INTO logs_alteracoes (tabela, registro_id, tipo_operacao, dados_novos, usuario)
    VALUES ('motoristas', NEW.id, 'INSERT', 
            JSON_OBJECT('id', NEW.id, 'nome', NEW.nome, 'telefone', NEW.telefone, 
                       'veiculo', NEW.veiculo, 'placa', NEW.placa, 'cidade', NEW.cidade,
                       'bairro', NEW.bairro, 'estado', NEW.estado, 'ativo', NEW.ativo),
            'system');
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER motoristas_after_update
AFTER UPDATE ON motoristas
FOR EACH ROW
BEGIN
    INSERT INTO logs_alteracoes (tabela, registro_id, tipo_operacao, dados_antigos, dados_novos, usuario)
    VALUES ('motoristas', NEW.id, 'UPDATE',
            JSON_OBJECT('id', OLD.id, 'nome', OLD.nome, 'telefone', OLD.telefone,
                       'veiculo', OLD.veiculo, 'placa', OLD.placa, 'cidade', OLD.cidade,
                       'bairro', OLD.bairro, 'estado', OLD.estado, 'ativo', OLD.ativo),
            JSON_OBJECT('id', NEW.id, 'nome', NEW.nome, 'telefone', NEW.telefone,
                       'veiculo', NEW.veiculo, 'placa', NEW.placa, 'cidade', NEW.cidade,
                       'bairro', NEW.bairro, 'estado', NEW.estado, 'ativo', NEW.ativo),
            'system');
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER motoristas_after_delete
AFTER DELETE ON motoristas
FOR EACH ROW
BEGIN
    INSERT INTO logs_alteracoes (tabela, registro_id, tipo_operacao, dados_antigos, usuario)
    VALUES ('motoristas', OLD.id, 'DELETE',
            JSON_OBJECT('id', OLD.id, 'nome', OLD.nome, 'telefone', OLD.telephone,
                       'veiculo', OLD.veiculo, 'placa', OLD.placa, 'cidade', OLD.cidade,
                       'bairro', OLD.bairro, 'estado', OLD.estado, 'ativo', OLD.ativo),
            'system');
END//
DELIMITER ;

-- View para estatísticas
CREATE VIEW vw_estatisticas AS
SELECT 
    COUNT(DISTINCT m.id) as total_motoristas,
    COUNT(DISTINCT CASE WHEN m.ativo = 1 THEN m.id END) as motoristas_ativos,
    COUNT(DISTINCT e.id) as total_entregas,
    COUNT(DISTINCT CASE WHEN e.status = 'pending' THEN e.id END) as entregas_pendentes,
    COUNT(DISTINCT CASE WHEN e.status = 'delivered' THEN e.id END) as entregas_entregues,
    COUNT(DISTINCT CASE WHEN e.status = 'failed' THEN e.id END) as entregas_falhas,
    COUNT(DISTINCT a.id) as total_arquivos,
    DATE(e.data_importacao) as data
FROM motoristas m
CROSS JOIN entregas e
CROSS JOIN arquivos_importados a
WHERE DATE(e.data_importacao) = CURDATE() OR e.data_importacao IS NULL;

-- View para motoristas com suas áreas de cobertura
CREATE VIEW vw_motoristas_com_areas AS
SELECT 
    m.id,
    m.nome,
    m.telefone,
    m.veiculo,
    m.placa,
    m.cidade as cidade_residencia,
    m.bairro as bairro_residencia,
    m.estado as estado_residencia,
    m.ativo,
    m.created_at,
    GROUP_CONCAT(DISTINCT CONCAT(ac.cidade, '/', ac.bairro, IF(ac.estado IS NOT NULL, CONCAT('/', ac.estado), '')) 
                 ORDER BY ac.cidade, ac.bairro SEPARATOR '; ') as areas_cobertura
FROM motoristas m
LEFT JOIN motoristas_areas_cobertura ac ON m.id = ac.motorista_id
GROUP BY m.id, m.nome, m.telefone, m.veiculo, m.placa, m.cidade, m.bairro, m.estado, m.ativo, m.created_at;

-- View para entregas com informações do motorista
CREATE VIEW vw_entregas_com_motorista AS
SELECT 
    e.id,
    e.codigo_rastreio,
    e.nome_destinatario,
    e.endereco,
    e.numero,
    e.complemento,
    e.bairro,
    e.cidade,
    e.estado,
    e.cep,
    e.status,
    e.rota_grupo,
    e.ordem_entrega,
    e.observacoes,
    e.data_importacao,
    e.data_entrega,
    m.nome as nome_motorista,
    m.telefone as telefone_motorista,
    m.veiculo as veiculo_motorista,
    m.placa as placa_motorista,
    gr.nome as nome_grupo_rota,
    gr.cor as cor_grupo_rota
FROM entregas e
LEFT JOIN motoristas m ON e.motorista_id = m.id
LEFT JOIN grupos_rotas gr ON e.rota_grupo = gr.id;

-- Inserir dados de exemplo (opcional)
INSERT INTO motoristas (id, nome, telefone, veiculo, placa, cidade, bairro, estado, ativo) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'João Silva', '(11) 98765-4321', 'Moto', 'ABC-1234', 'São Paulo', 'Vila Mariana', 'SP', TRUE),
('550e8400-e29b-41d4-a716-446655440002', 'Maria Santos', '(11) 91234-5678', 'Van', 'DEF-5678', 'São Paulo', 'Pinheiros', 'SP', TRUE);

INSERT INTO motoristas_areas_cobertura (motorista_id, cidade, bairro, estado) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'São Paulo', 'Moema', 'SP'),
('550e8400-e29b-41d4-a716-446655440001', 'São Paulo', 'Itaim Bibi', 'SP'),
('550e8400-e29b-41d4-a716-446655440002', 'São Paulo', 'Jardins', 'SP'),
('550e8400-e29b-41d4-a716-446655440002', 'São Paulo', 'Alto de Pinheiros', 'SP');

INSERT INTO grupos_rotas (id, nome, cor, motorista_id) VALUES
(1, 'Rota Centro', '#3B82F6', '550e8400-e29b-41d4-a716-446655440001'),
(2, 'Rota Zona Sul', '#10B981', '550e8400-e29b-41d4-a716-446655440002');

-- Comandos úteis para manutenção
-- Para limpar todos os dados (cuidado!):
-- DELETE FROM logs_alteracoes;
-- DELETE FROM motoristas_areas_cobertura;
-- DELETE FROM entregas;
-- DELETE FROM grupos_rotas;
-- DELETE FROM motoristas;
-- DELETE FROM arquivos_importados;

-- Para resetar auto increment:
-- ALTER TABLE motoristas_areas_cobertura AUTO_INCREMENT = 1;
-- ALTER TABLE grupos_rotas AUTO_INCREMENT = 1;
-- ALTER TABLE arquivos_importados AUTO_INCREMENT = 1;
-- ALTER TABLE logs_alteracoes AUTO_INCREMENT = 1;
