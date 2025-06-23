import apiClient from './api';

export const dashboardService = {
  // Buscar métricas principais do dashboard
  async getMetrics(period = 'month') {
    try {
      const response = await apiClient.get(`/dashboard/metrics?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      // Retornar dados mock enquanto o backend não está implementado
      return this.getMockMetrics(period);
    }
  },

  // Buscar dados de vendas
  async getSalesData(period = 'week') {
    try {
      const response = await apiClient.get(`/dashboard/sales?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados de vendas:', error);
      return this.getMockSalesData(period);
    }
  },

  // Buscar tarefas pendentes
  async getPendingTasks() {
    try {
      const response = await apiClient.get('/tasks?status=novo,em_progresso&limit=1000');
      return {
        total: response.data.data?.length || 0,
        overdue: response.data.data?.filter(task => {
          const dueDate = new Date(task.data_vencimento);
          return dueDate < new Date() && task.status !== 'concluido';
        }).length || 0,
        today: response.data.data?.filter(task => {
          const dueDate = new Date(task.data_vencimento);
          const today = new Date();
          return dueDate.toDateString() === today.toDateString();
        }).length || 0
      };
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      return { total: 0, overdue: 0, today: 0 };
    }
  },

  // Buscar novos clientes
  async getNewClients(period = 'week') {
    try {
      const response = await apiClient.get('/clients?limit=1000');
      const clients = response.data.data || [];
      
      const now = new Date();
      let filterDate = new Date();
      
      switch(period) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        default:
          filterDate.setDate(now.getDate() - 7);
      }

      const newClients = clients.filter(client => {
        const createdDate = new Date(client.created_at || client.data_cadastro);
        return createdDate >= filterDate;
      });

      // Calcular ticket médio
      const totalValue = newClients.reduce((sum, client) => {
        return sum + (parseFloat(client.ticket_medio) || 0);
      }, 0);
      
      return {
        count: newClients.length,
        averageTicket: newClients.length > 0 ? totalValue / newClients.length : 0,
        totalValue: totalValue,
        clients: newClients
      };
    } catch (error) {
      console.error('Erro ao buscar novos clientes:', error);
      return { count: 0, averageTicket: 0, totalValue: 0, clients: [] };
    }
  },

  // Buscar faturamento
  async getRevenue(period = 'month') {
    try {
      const response = await apiClient.get(`/finance/transactions?tipo=entrada&period=${period}`);
      const transactions = response.data.data || [];
      
      const total = transactions.reduce((sum, transaction) => {
        return sum + parseFloat(transaction.valor);
      }, 0);

      return {
        total: total,
        transactions: transactions.length,
        byCategory: this.groupByCategory(transactions)
      };
    } catch (error) {
      console.error('Erro ao buscar faturamento:', error);
      return { total: 0, transactions: 0, byCategory: {} };
    }
  },

  // Buscar produtos mais vendidos
  async getTopProducts() {
    try {
      // Como não temos vendas diretas, vamos usar os clientes que compraram produtos
      const clientsResponse = await apiClient.get('/clients?limit=1000');
      const clients = clientsResponse.data.data || [];
      
      const productsResponse = await apiClient.get('/products?limit=1000');
      const products = productsResponse.data.data || [];

      // Contar quantos clientes têm cada produto
      const productSales = {};
      
      clients.forEach(client => {
        if (client.produto_interesse) {
          const productName = client.produto_interesse;
          if (!productSales[productName]) {
            productSales[productName] = {
              name: productName,
              sales: 0,
              revenue: 0,
              clients: []
            };
          }
          productSales[productName].sales += 1;
          productSales[productName].revenue += parseFloat(client.ticket_medio) || 0;
          productSales[productName].clients.push(client);
        }
      });

      return Object.values(productSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);
    } catch (error) {
      console.error('Erro ao buscar produtos mais vendidos:', error);
      return [];
    }
  },

  // Agrupar por categoria
  groupByCategory(transactions) {
    return transactions.reduce((acc, transaction) => {
      const category = transaction.categoria || 'Sem categoria';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += parseFloat(transaction.valor);
      return acc;
    }, {});
  },

  // Dados mock para desenvolvimento
  getMockMetrics(period) {
    return {
      totalClients: 156,
      newClients: 12,
      revenue: 45630,
      tasks: 8,
      growth: {
        clients: 8.5,
        revenue: 12.3,
        tasks: -15.2
      }
    };
  },

  getMockSalesData(period) {
    const data = {
      week: [
        { date: '2024-01-15', value: 2500 },
        { date: '2024-01-16', value: 3200 },
        { date: '2024-01-17', value: 2800 },
        { date: '2024-01-18', value: 4100 },
        { date: '2024-01-19', value: 3600 },
        { date: '2024-01-20', value: 2900 },
        { date: '2024-01-21', value: 3800 }
      ],
      month: [
        { date: 'Sem 1', value: 18500 },
        { date: 'Sem 2', value: 22300 },
        { date: 'Sem 3', value: 19800 },
        { date: 'Sem 4', value: 26100 }
      ]
    };
    return data[period] || data.week;
  }
};