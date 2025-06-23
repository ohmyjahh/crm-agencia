-- Migration: Add Reporting Views and Procedures
-- Created: 2025-06-22
-- Description: Creates views and stored procedures for complex reports

-- View para Dashboard Metrics - métricas principais do sistema
CREATE VIEW IF NOT EXISTS dashboard_metrics_view AS
SELECT 
  -- Métricas de Clientes
  (SELECT COUNT(*) FROM clients WHERE is_active = 1) as active_clients,
  (SELECT COUNT(*) FROM clients WHERE is_active = 1 AND category = 'ouro') as gold_clients,
  (SELECT COUNT(*) FROM clients WHERE is_active = 1 AND category = 'prata') as silver_clients,
  (SELECT COUNT(*) FROM clients WHERE is_active = 1 AND category = 'bronze') as bronze_clients,
  (SELECT COUNT(*) FROM clients WHERE is_active = 1 AND created_at >= date('now', '-30 days')) as new_clients_month,
  
  -- Métricas de Tasks
  (SELECT COUNT(*) FROM tasks WHERE status != 'cancelado') as total_tasks,
  (SELECT COUNT(*) FROM tasks WHERE status = 'novo') as new_tasks,
  (SELECT COUNT(*) FROM tasks WHERE status = 'em_progresso') as in_progress_tasks,
  (SELECT COUNT(*) FROM tasks WHERE status = 'aguardando_validacao') as pending_tasks,
  (SELECT COUNT(*) FROM tasks WHERE status = 'concluido') as completed_tasks,
  (SELECT COUNT(*) FROM tasks WHERE due_date < date('now') AND status NOT IN ('concluido', 'cancelado')) as overdue_tasks,
  (SELECT COUNT(*) FROM tasks WHERE priority = 'urgente' AND status NOT IN ('concluido', 'cancelado')) as urgent_tasks,
  
  -- Métricas de Projetos
  (SELECT COUNT(*) FROM projects WHERE status = 'ativo') as active_projects,
  (SELECT COUNT(*) FROM projects WHERE status = 'concluido') as completed_projects,
  (SELECT COUNT(*) FROM projects WHERE status = 'pausado') as paused_projects,
  
  -- Métricas Financeiras (último mês)
  (SELECT COALESCE(SUM(amount), 0) FROM finance_transactions 
   WHERE type = 'entrada' AND transaction_date >= date('now', '-30 days')) as revenue_month,
  (SELECT COALESCE(SUM(amount), 0) FROM finance_transactions 
   WHERE type = 'saida' AND transaction_date >= date('now', '-30 days')) as expenses_month,
  (SELECT COALESCE(SUM(amount), 0) FROM finance_transactions 
   WHERE type = 'entrada' AND transaction_date >= date('now', '-30 days')) - 
  (SELECT COALESCE(SUM(amount), 0) FROM finance_transactions 
   WHERE type = 'saida' AND transaction_date >= date('now', '-30 days')) as profit_month;

-- View para Performance de Clientes
CREATE VIEW IF NOT EXISTS client_performance_view AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.category,
  c.service_format,
  c.total_purchases,
  c.average_ticket,
  c.first_purchase_date,
  c.last_purchase_date,
  
  -- Calcular days since last purchase
  CASE 
    WHEN c.last_purchase_date IS NOT NULL 
    THEN julianday('now') - julianday(c.last_purchase_date)
    ELSE NULL 
  END as days_since_last_purchase,
  
  -- Total gasto pelo cliente
  COALESCE(cp.total_spent, 0) as total_spent,
  
  -- Número de projetos ativos
  COALESCE(p.active_projects, 0) as active_projects,
  
  -- Número de tasks em aberto
  COALESCE(t.open_tasks, 0) as open_tasks,
  
  -- Score de engajamento (baseado em recência, frequência e valor)
  CASE 
    WHEN c.last_purchase_date IS NULL THEN 0
    WHEN julianday('now') - julianday(c.last_purchase_date) <= 30 THEN 100
    WHEN julianday('now') - julianday(c.last_purchase_date) <= 90 THEN 75
    WHEN julianday('now') - julianday(c.last_purchase_date) <= 180 THEN 50
    WHEN julianday('now') - julianday(c.last_purchase_date) <= 365 THEN 25
    ELSE 10
  END as engagement_score

FROM clients c
LEFT JOIN (
  SELECT 
    client_id,
    SUM(amount) as total_spent
  FROM client_purchases 
  WHERE status = 'ativo'
  GROUP BY client_id
) cp ON c.id = cp.client_id
LEFT JOIN (
  SELECT 
    client_id,
    COUNT(*) as active_projects
  FROM projects 
  WHERE status = 'ativo'
  GROUP BY client_id
) p ON c.id = p.client_id
LEFT JOIN (
  SELECT 
    client_id,
    COUNT(*) as open_tasks
  FROM tasks 
  WHERE status NOT IN ('concluido', 'cancelado')
  GROUP BY client_id
) t ON c.id = t.client_id
WHERE c.is_active = 1;

-- View para Análise Financeira Mensal
CREATE VIEW IF NOT EXISTS monthly_finance_analysis AS
SELECT 
  strftime('%Y-%m', transaction_date) as month_year,
  strftime('%Y', transaction_date) as year,
  strftime('%m', transaction_date) as month,
  
  -- Receitas
  SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END) as revenue,
  
  -- Despesas
  SUM(CASE WHEN type = 'saida' THEN amount ELSE 0 END) as expenses,
  
  -- Lucro/Prejuízo
  SUM(CASE WHEN type = 'entrada' THEN amount ELSE -amount END) as profit,
  
  -- Número de transações
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN type = 'entrada' THEN 1 END) as revenue_transactions,
  COUNT(CASE WHEN type = 'saida' THEN 1 END) as expense_transactions,
  
  -- Ticket médio
  AVG(CASE WHEN type = 'entrada' THEN amount END) as avg_revenue_ticket,
  AVG(CASE WHEN type = 'saida' THEN amount END) as avg_expense_ticket

FROM finance_transactions
GROUP BY strftime('%Y-%m', transaction_date)
ORDER BY month_year DESC;

-- View para Top Clientes por Valor
CREATE VIEW IF NOT EXISTS top_clients_by_value AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.category,
  c.total_purchases,
  c.average_ticket,
  COALESCE(cp.total_spent, 0) as total_spent,
  COALESCE(ft.total_revenue, 0) as total_revenue,
  c.last_purchase_date,
  
  -- Ranking
  ROW_NUMBER() OVER (ORDER BY COALESCE(cp.total_spent, 0) DESC) as value_rank

FROM clients c
LEFT JOIN (
  SELECT 
    client_id,
    SUM(amount) as total_spent
  FROM client_purchases 
  WHERE status = 'ativo'
  GROUP BY client_id
) cp ON c.id = cp.client_id
LEFT JOIN (
  SELECT 
    client_id,
    SUM(amount) as total_revenue
  FROM finance_transactions 
  WHERE type = 'entrada'
  GROUP BY client_id
) ft ON c.id = ft.client_id
WHERE c.is_active = 1
ORDER BY total_spent DESC;

-- View para Análise de Produtividade por Usuário
CREATE VIEW IF NOT EXISTS user_productivity_view AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  
  -- Tasks atribuídas
  COALESCE(t.total_tasks, 0) as total_tasks,
  COALESCE(t.completed_tasks, 0) as completed_tasks,
  COALESCE(t.in_progress_tasks, 0) as in_progress_tasks,
  COALESCE(t.overdue_tasks, 0) as overdue_tasks,
  
  -- Taxa de conclusão
  CASE 
    WHEN COALESCE(t.total_tasks, 0) > 0 
    THEN ROUND((COALESCE(t.completed_tasks, 0) * 100.0) / t.total_tasks, 2)
    ELSE 0 
  END as completion_rate,
  
  -- Clientes criados
  COALESCE(c.clients_created, 0) as clients_created,
  
  -- Projetos criados
  COALESCE(p.projects_created, 0) as projects_created,
  
  -- Score de produtividade
  (COALESCE(t.completed_tasks, 0) * 2 + 
   COALESCE(c.clients_created, 0) * 3 + 
   COALESCE(p.projects_created, 0) * 5) as productivity_score

FROM users u
LEFT JOIN (
  SELECT 
    assigned_to,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN status = 'concluido' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN status = 'em_progresso' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN due_date < date('now') AND status NOT IN ('concluido', 'cancelado') THEN 1 END) as overdue_tasks
  FROM tasks 
  GROUP BY assigned_to
) t ON u.id = t.assigned_to
LEFT JOIN (
  SELECT 
    created_by,
    COUNT(*) as clients_created
  FROM clients 
  WHERE is_active = 1
  GROUP BY created_by
) c ON u.id = c.created_by
LEFT JOIN (
  SELECT 
    created_by,
    COUNT(*) as projects_created
  FROM projects 
  GROUP BY created_by
) p ON u.id = p.created_by
WHERE u.is_active = 1;

-- View para Análise de Serviços
CREATE VIEW IF NOT EXISTS service_analysis_view AS
SELECT 
  s.id,
  s.name,
  s.category,
  s.service_type,
  s.base_price,
  s.estimated_hours,
  
  -- Quantas vezes foi contratado
  COALESCE(cs.contracts_count, 0) as contracts_count,
  
  -- Revenue gerada
  COALESCE(cs.total_revenue, 0) as total_revenue,
  
  -- Tasks relacionadas
  COALESCE(t.related_tasks, 0) as related_tasks,
  
  -- Popularidade (ranking)
  ROW_NUMBER() OVER (ORDER BY COALESCE(cs.contracts_count, 0) DESC) as popularity_rank

FROM services s
LEFT JOIN (
  SELECT 
    service_id,
    COUNT(*) as contracts_count,
    SUM(monthly_value) as total_revenue
  FROM client_services 
  WHERE status = 'ativo'
  GROUP BY service_id
) cs ON s.id = cs.service_id
LEFT JOIN (
  SELECT 
    service_id,
    COUNT(*) as related_tasks
  FROM tasks 
  WHERE service_id IS NOT NULL
  GROUP BY service_id
) t ON s.id = t.service_id
WHERE s.is_active = 1
ORDER BY contracts_count DESC;

-- View para DRE Simplificado
CREATE VIEW IF NOT EXISTS dre_summary_view AS
SELECT 
  strftime('%Y-%m', transaction_date) as period,
  
  -- RECEITAS
  SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END) as receita_bruta,
  
  -- CUSTOS E DESPESAS (por categoria se existir)
  SUM(CASE WHEN type = 'saida' AND fc.name LIKE '%Custo%' THEN amount ELSE 0 END) as custos_diretos,
  SUM(CASE WHEN type = 'saida' AND fc.name LIKE '%Operacional%' THEN amount ELSE 0 END) as despesas_operacionais,
  SUM(CASE WHEN type = 'saida' AND fc.name LIKE '%Administrativ%' THEN amount ELSE 0 END) as despesas_administrativas,
  SUM(CASE WHEN type = 'saida' AND fc.name LIKE '%Marketing%' THEN amount ELSE 0 END) as despesas_marketing,
  SUM(CASE WHEN type = 'saida' AND (fc.name IS NULL OR fc.name NOT LIKE '%Custo%' AND fc.name NOT LIKE '%Operacional%' AND fc.name NOT LIKE '%Administrativ%' AND fc.name NOT LIKE '%Marketing%') THEN amount ELSE 0 END) as outras_despesas,
  
  -- TOTAIS
  SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END) - 
  SUM(CASE WHEN type = 'saida' THEN amount ELSE 0 END) as resultado_liquido,
  
  -- MARGENS
  CASE 
    WHEN SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END) > 0 
    THEN ROUND(((SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'saida' THEN amount ELSE 0 END)) * 100.0) / SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END), 2)
    ELSE 0 
  END as margem_liquida

FROM finance_transactions ft
LEFT JOIN finance_categories fc ON ft.category_id = fc.id
GROUP BY strftime('%Y-%m', transaction_date)
ORDER BY period DESC;

-- Register migration
INSERT OR IGNORE INTO schema_migrations (version, name) VALUES ('20250622_004_add_reporting_views', 'Add Reporting Views and Procedures');