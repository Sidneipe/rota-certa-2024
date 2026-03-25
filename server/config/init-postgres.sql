-- Criar tabelas no PostgreSQL

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    papel VARCHAR(50) CHECK (papel IN ('admin', 'operator', 'driver')) NOT NULL,
    driver_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de motoristas
CREATE TABLE IF NOT EXISTS motoristas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(50),
    veiculo VARCHAR(100),
    placa VARCHAR(20),
    cidade VARCHAR(255) NOT NULL,
    bairro VARCHAR(255) NOT NULL,
    estado VARCHAR(50),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de áreas de cobertura
CREATE TABLE IF NOT EXISTS areas_cobertura (
    id SERIAL PRIMARY KEY,
    motorista_id UUID NOT NULL REFERENCES motoristas(id) ON DELETE CASCADE,
    cidade VARCHAR(255) NOT NULL,
    bairro VARCHAR(255) NOT NULL,
    estado VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de entregas
CREATE TABLE IF NOT EXISTS entregas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_rastreio VARCHAR(100),
    nome_destinatario VARCHAR(255) NOT NULL,
    endereco VARCHAR(500) NOT NULL,
    numero VARCHAR(50),
    complemento VARCHAR(255),
    bairro VARCHAR(255) NOT NULL,
    cidade VARCHAR(255) NOT NULL,
    estado VARCHAR(50),
    cep VARCHAR(20),
    telefone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pendente',
    data_entrega DATE,
    observacoes TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    rota_codigo VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de grupos de rotas
CREATE TABLE IF NOT EXISTS grupos_rotas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cor VARCHAR(20) NOT NULL,
    motorista_id UUID REFERENCES motoristas(id) ON DELETE SET NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT true
);

-- Tabela de arquivos importados
CREATE TABLE IF NOT EXISTS arquivos_importados (
    id SERIAL PRIMARY KEY,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(10) CHECK (tipo_arquivo IN ('pdf', 'xlsx', 'xls', 'csv')) NOT NULL,
    tamanho_arquivo INTEGER NOT NULL,
    quantidade_registros INTEGER DEFAULT 0,
    data_importacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_importacao VARCHAR(20) CHECK (status_importacao IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
    erro_importacao TEXT
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_motoristas_ativo ON motoristas(ativo);
CREATE INDEX IF NOT EXISTS idx_motoristas_cidade ON motoristas(cidade);
CREATE INDEX IF NOT EXISTS idx_areas_motorista ON areas_cobertura(motorista_id);
CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas(status);
CREATE INDEX IF NOT EXISTS idx_entregas_rota ON entregas(rota_codigo);
CREATE INDEX IF NOT EXISTS idx_grupos_ativo ON grupos_rotas(ativo);
