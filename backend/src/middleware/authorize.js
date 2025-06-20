// Middleware para verificar permissões baseadas em roles

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ 
      error: 'Acesso negado. Apenas administradores podem acessar este recurso.' 
    });
  }
  next();
};

const requireAdminOrOwner = (userIdParam = 'id') => {
  return (req, res, next) => {
    const userId = req.params[userIdParam];
    
    // Admin pode acessar qualquer recurso
    if (req.user.role === 'administrador') {
      return next();
    }
    
    // Usuário pode acessar apenas seus próprios recursos
    if (req.user.id === userId) {
      return next();
    }
    
    return res.status(403).json({ 
      error: 'Acesso negado. Você só pode acessar seus próprios recursos.' 
    });
  };
};

const requireAdminOrAssigned = (req, res, next) => {
  // Admin pode acessar qualquer recurso
  if (req.user.role === 'administrador') {
    return next();
  }
  
  // Para funcionários, verificar se o recurso foi atribuído a ele
  // Isso será implementado nas rotas específicas conforme necessário
  next();
};

// Middleware para verificar se usuário pode gerenciar outros usuários
const canManageUsers = (req, res, next) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ 
      error: 'Acesso negado. Apenas administradores podem gerenciar usuários.' 
    });
  }
  next();
};

// Middleware para verificar se usuário pode gerenciar finanças
const canManageFinances = (req, res, next) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ 
      error: 'Acesso negado. Apenas administradores podem gerenciar finanças.' 
    });
  }
  next();
};

// Middleware para verificar se usuário pode criar/editar clientes
const canManageClients = (req, res, next) => {
  // Tanto admin quanto funcionário podem gerenciar clientes
  // Mas funcionários podem ter restrições específicas implementadas nas rotas
  next();
};

// Middleware para verificar se usuário pode gerenciar tarefas
const canManageTasks = (req, res, next) => {
  // Tanto admin quanto funcionário podem gerenciar tarefas
  // Mas funcionários podem ver apenas suas tarefas
  next();
};

module.exports = {
  requireAdmin,
  requireAdminOrOwner,
  requireAdminOrAssigned,
  canManageUsers,
  canManageFinances,
  canManageClients,
  canManageTasks
};