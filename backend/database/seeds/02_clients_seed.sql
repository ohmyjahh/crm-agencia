-- Seed: Clients
-- Description: Dados de teste para clientes

-- Inserir clientes de teste
INSERT OR IGNORE INTO clients (
  id, name, email, phone, document, document_type, 
  address, city, state, zip_code, notes, category, 
  service_format, average_ticket, total_purchases, 
  first_purchase_date, last_purchase_date, is_active, 
  created_by, created_at
) VALUES
-- Clientes Ouro (alto valor)
('client-ouro-001', 'TechCorp Ltda', 'contato@techcorp.com', '11987654321', '12345678000195', 'CNPJ', 
 'Av. Paulista, 1000', 'São Paulo', 'SP', '01310-100', 'Cliente premium com múltiplos projetos', 'ouro', 
 'recorrente', 15000.00, 12, datetime('now', '-365 days'), datetime('now', '-30 days'), 1, 
 'admin-user-001', datetime('now', '-400 days')),

('client-ouro-002', 'Inovação Digital', 'contato@inovacaodigital.com', '11876543210', '98765432000123', 'CNPJ', 
 'R. Augusta, 500', 'São Paulo', 'SP', '01305-000', 'Empresa de tecnologia com foco em inovação', 'ouro', 
 'personalizado', 22000.00, 8, datetime('now', '-300 days'), datetime('now', '-15 days'), 1, 
 'func-user-002', datetime('now', '-350 days')),

('client-ouro-003', 'Global Solutions', 'comercial@globalsolutions.com', '11765432109', '11223344000156', 'CNPJ', 
 'Av. Faria Lima, 2000', 'São Paulo', 'SP', '04538-132', 'Multinacional com demandas complexas', 'ouro', 
 'recorrente', 18500.00, 15, datetime('now', '-450 days'), datetime('now', '-7 days'), 1, 
 'admin-user-001', datetime('now', '-500 days')),

-- Clientes Prata (médio valor)
('client-prata-001', 'Comercial ABC', 'vendas@comercialabc.com', '11654321098', '55667788000134', 'CNPJ', 
 'R. Consolação, 800', 'São Paulo', 'SP', '01302-907', 'Empresa de médio porte em crescimento', 'prata', 
 'avulso', 8500.00, 6, datetime('now', '-180 days'), datetime('now', '-45 days'), 1, 
 'func-user-003', datetime('now', '-200 days')),

('client-prata-002', 'StartUp XYZ', 'contato@startupxyz.com', '11543210987', '99887766000112', 'CNPJ', 
 'R. Oscar Freire, 300', 'São Paulo', 'SP', '01426-001', 'Startup com potencial de crescimento', 'prata', 
 'personalizado', 12000.00, 4, datetime('now', '-120 days'), datetime('now', '-20 days'), 1, 
 'func-user-004', datetime('now', '-150 days')),

('client-prata-003', 'Serviços Pro', 'atendimento@servicospro.com', '11432109876', '44556677000198', 'CNPJ', 
 'Av. Rebouças, 1500', 'São Paulo', 'SP', '05402-100', 'Empresa de serviços especializados', 'prata', 
 'recorrente', 6800.00, 9, datetime('now', '-240 days'), datetime('now', '-10 days'), 1, 
 'func-user-002', datetime('now', '-280 days')),

-- Clientes Bronze (baixo valor)
('client-bronze-001', 'João Empreendedor', 'joao@empreendedor.com', '11321098765', '12345678901', 'CPF', 
 'R. da Liberdade, 100', 'São Paulo', 'SP', '01503-010', 'Empreendedor individual', 'bronze', 
 'avulso', 2500.00, 3, datetime('now', '-90 days'), datetime('now', '-60 days'), 1, 
 'func-user-003', datetime('now', '-120 days')),

('client-bronze-002', 'Maria Consultora', 'maria@consultora.com', '11210987654', '98765432100', 'CPF', 
 'R. Augusta, 200', 'São Paulo', 'SP', '01305-000', 'Consultora autônoma', 'bronze', 
 'avulso', 1800.00, 2, datetime('now', '-60 days'), datetime('now', '-30 days'), 1, 
 'func-user-004', datetime('now', '-80 days')),

('client-bronze-003', 'Pequeno Negócio', 'contato@pequenonegocio.com', '11109876543', '22334455000167', 'CNPJ', 
 'R. 25 de Março, 50', 'São Paulo', 'SP', '01021-020', 'Pequena empresa familiar', 'bronze', 
 'avulso', 3200.00, 5, datetime('now', '-150 days'), datetime('now', '-75 days'), 1, 
 'func-user-002', datetime('now', '-180 days')),

('client-bronze-004', 'Loja Local', 'vendas@lojalocal.com', '11098765432', '33445566000145', 'CNPJ', 
 'R. do Comércio, 150', 'São Paulo', 'SP', '01010-000', 'Loja de bairro tradicional', 'bronze', 
 'recorrente', 1500.00, 8, datetime('now', '-200 days'), datetime('now', '-90 days'), 1, 
 'func-user-003', datetime('now', '-220 days')),

-- Clientes inativos (para teste de filtros)
('client-inactive-001', 'Ex-Cliente Corp', 'ex@cliente.com', '11987654320', '66778899000123', 'CNPJ', 
 'Av. Paulista, 2000', 'São Paulo', 'SP', '01310-200', 'Cliente que encerrou contrato', 'prata', 
 'recorrente', 5000.00, 6, datetime('now', '-300 days'), datetime('now', '-180 days'), 0, 
 'admin-user-001', datetime('now', '-350 days')),

-- Clientes recentes (sem compras ainda)
('client-new-001', 'Prospect Quente', 'contato@prospectquente.com', '11876543219', '77889900000134', 'CNPJ', 
 'R. Estados Unidos, 1000', 'São Paulo', 'SP', '01427-002', 'Prospect com alta probabilidade de conversão', 'bronze', 
 'avulso', 0.00, 0, NULL, NULL, 1, 
 'func-user-004', datetime('now', '-5 days')),

('client-new-002', 'Novo Empresário', 'novo@empresario.com', '11765432108', '88990011000156', 'CNPJ', 
 'Av. Ibirapuera, 500', 'São Paulo', 'SP', '04029-000', 'Empresário recém cadastrado', 'bronze', 
 'personalizado', 0.00, 0, NULL, NULL, 1, 
 'func-user-002', datetime('now', '-2 days'));