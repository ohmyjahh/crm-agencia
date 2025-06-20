-- Dados iniciais para o CRM
-- Execute após criar o schema

-- Inserir categorias financeiras padrão
INSERT INTO finance_categories (name, type, description) VALUES 
('Vendas de Serviços', 'entrada', 'Receitas provenientes de prestação de serviços'),
('Vendas de Produtos', 'entrada', 'Receitas provenientes de venda de produtos'),
('Consultoria', 'entrada', 'Receitas de serviços de consultoria'),
('Outros Recebimentos', 'entrada', 'Outras formas de receita'),

('Salários', 'saida', 'Pagamento de salários e benefícios'),
('Aluguel', 'saida', 'Despesas com aluguel do escritório'),
('Energia e Água', 'saida', 'Contas de energia elétrica e água'),
('Internet e Telefone', 'saida', 'Despesas com telecomunicações'),
('Material de Escritório', 'saida', 'Compra de materiais para escritório'),
('Marketing e Publicidade', 'saida', 'Investimentos em marketing'),
('Equipamentos', 'saida', 'Compra de equipamentos e tecnologia'),
('Impostos e Taxas', 'saida', 'Pagamento de impostos e taxas governamentais'),
('Outras Despesas', 'saida', 'Outras despesas operacionais');

-- Criar usuário administrador padrão
-- Senha: admin123 (deve ser alterada no primeiro login)
INSERT INTO users (name, email, password_hash, role) VALUES 
(
    'Administrador', 
    'admin@crm.com', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'administrador'
);

-- Comentário com informações importantes
-- IMPORTANTE: Altere a senha padrão após o primeiro login!
-- Email: admin@crm.com
-- Senha: admin123