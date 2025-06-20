const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Configurar interceptor para logs
axios.interceptors.request.use(request => {
  console.log(`🔵 ${request.method.toUpperCase()} ${request.url}`);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log(`✅ ${response.status}: ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  error => {
    console.log(`❌ ${error.response?.status || 'ERROR'}: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.log(`   ${error.response?.data?.error || error.message}`);
    return Promise.reject(error);
  }
);

async function testAuth() {
  console.log('🧪 Testando sistema de autenticação...\n');

  try {
    // 1. Testar health check
    console.log('1️⃣ Verificando se API está online...');
    await axios.get(`${API_BASE}/../health`);
    console.log('✅ API está online!\n');

    // 2. Testar login com credenciais padrão
    console.log('2️⃣ Testando login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@crm.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✅ Login bem sucedido!');
    console.log(`   👤 Usuário: ${user.name} (${user.email})`);
    console.log(`   🔑 Role: ${user.role}`);
    console.log(`   🎫 Token: ${token.substring(0, 20)}...\n`);

    // 3. Testar rota protegida
    console.log('3️⃣ Testando rota protegida...');
    const profileResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Acesso autorizado!');
    console.log(`   📊 Dados do usuário: ${JSON.stringify(profileResponse.data.user, null, 2)}\n`);

    // 4. Testar acesso sem token
    console.log('4️⃣ Testando acesso sem token...');
    try {
      await axios.get(`${API_BASE}/auth/me`);
    } catch (error) {
      console.log('✅ Acesso negado sem token (esperado)\n');
    }

    // 5. Testar token inválido
    console.log('5️⃣ Testando token inválido...');
    try {
      await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: 'Bearer token_invalido' }
      });
    } catch (error) {
      console.log('✅ Token inválido rejeitado (esperado)\n');
    }

    // 6. Testar registro de novo usuário (apenas admin)
    console.log('6️⃣ Testando criação de usuário...');
    try {
      const newUserResponse = await axios.post(`${API_BASE}/auth/register`, {
        name: 'Funcionário Teste',
        email: 'funcionario@crm.com',
        password: 'Senha123',
        role: 'funcionario'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Usuário criado com sucesso!');
      console.log(`   👤 Novo usuário: ${newUserResponse.data.user.name}\n`);

      // 7. Testar login com novo usuário
      console.log('7️⃣ Testando login com novo usuário...');
      const newUserLogin = await axios.post(`${API_BASE}/auth/login`, {
        email: 'funcionario@crm.com',
        password: 'Senha123'
      });

      console.log('✅ Login do novo usuário bem sucedido!');
      console.log(`   👤 Usuário: ${newUserLogin.data.user.name} (${newUserLogin.data.user.role})\n`);

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error === 'Email já está em uso') {
        console.log('ℹ️  Usuário já existe (normal se executado anteriormente)\n');
      } else {
        throw error;
      }
    }

    console.log('🎉 Todos os testes de autenticação passaram!');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Dica: Certifique-se de que o servidor está rodando:');
      console.log('   cd backend && npm run dev');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testAuth();
}

module.exports = testAuth;