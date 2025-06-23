# Sistema de Status Clicáveis e Editáveis

Este sistema implementa status clicáveis e editáveis em todos os componentes de lista (ClientList, TaskList, ProductList, etc.).

## Componentes

### 1. EditableStatus
Componente reutilizável que renderiza um chip clicável que abre um menu dropdown para seleção de status.

**Props:**
- `value`: Valor atual do status
- `onChange`: Função chamada quando o status é alterado
- `options`: Array de opções de status padrão
- `loading`: Boolean indicando se está carregando
- `disabled`: Boolean para desabilitar o componente
- `size`: Tamanho do chip ('small', 'medium')
- `color`: Cor padrão do chip
- `variant`: Variante do chip ('filled', 'outlined')
- `statusType`: Tipo do status para agrupamento ('client_status', 'task_status', etc.)
- `renderLabel`: Função para renderizar label customizado
- `renderIcon`: Função para renderizar ícone customizado
- `onStatusUpdate`: Callback quando um status é criado/atualizado

### 2. CustomStatusModal
Modal para criação de status personalizados.

**Props:**
- `open`: Boolean para controlar abertura
- `onClose`: Função para fechar o modal
- `onSave`: Função chamada ao salvar novo status
- `statusType`: Tipo do status sendo criado
- `existingStatuses`: Array de status existentes para validação
- `loading`: Boolean indicando se está salvando

### 3. useCustomStatuses (Hook)
Hook para gerenciar status personalizados no localStorage.

**Retorna:**
- `customStatuses`: Array de todos os status personalizados
- `addCustomStatus`: Função para adicionar novo status
- `removeCustomStatus`: Função para remover status
- `updateCustomStatus`: Função para atualizar status
- `getCustomStatusesByType`: Função para filtrar por tipo
- `statusValueExists`: Função para verificar se valor já existe
- `loading`: Estado de carregamento
- `error`: Estado de erro

## Como Usar

### 1. Importar o componente
```jsx
import EditableStatus from '../ui/EditableStatus';
```

### 2. Definir opções de status padrão
```jsx
const statusOptions = [
  { value: 'ativo', label: 'Ativo', color: 'success', icon: <ActiveIcon /> },
  { value: 'inativo', label: 'Inativo', color: 'default', icon: <InactiveIcon /> }
];
```

### 3. Implementar função de atualização
```jsx
const handleStatusChange = async (item, field, newValue) => {
  try {
    setLoading(item.id);
    await api.put(`/items/${item.id}`, { [field]: newValue });
    // Recarregar lista
    await loadItems();
  } catch (error) {
    setError('Erro ao atualizar status');
  } finally {
    setLoading(null);
  }
};
```

### 4. Usar na tabela
```jsx
<TableCell>
  <EditableStatus
    value={item.status}
    onChange={(newValue) => handleStatusChange(item, 'status', newValue)}
    options={statusOptions}
    loading={updateLoading === item.id}
    statusType="item_status"
    size="small"
  />
</TableCell>
```

## Funcionalidades

### 1. Status Clicáveis
- Qualquer status na lista pode ser clicado
- Abre menu dropdown com opções disponíveis
- Visual feedback com hover e transformação

### 2. Status Padrão + Personalizados
- Mostra primeiro os status padrão do sistema
- Depois exibe status personalizados criados pelo usuário
- Separação visual entre os dois grupos

### 3. Criação de Status Personalizados
- Opção "Personalizar Status" no final do menu
- Modal com formulário completo
- Validação de campos obrigatórios
- Geração automática do valor interno
- Preview em tempo real

### 4. Persistência
- Status personalizados salvos no localStorage
- Disponíveis para todos os itens da mesma categoria
- Organizados por tipo (client_status, task_status, etc.)

### 5. Salvamento Automático
- Mudanças são salvas automaticamente
- Feedback visual durante carregamento
- Tratamento de erros

## Tipos de Status Implementados

### ClientList
- **client_status**: Status do cliente (Ativo/Inativo)
- **client_category**: Categoria (Bronze/Prata/Ouro)
- **client_format**: Formato do serviço (Avulso/Recorrente/Personalizado)

### TaskList
- **task_status**: Status da tarefa (Novo/Em Progresso/Concluído/etc.)
- **task_priority**: Prioridade (Baixa/Média/Alta/Urgente)

### ProductList
- **product_status**: Status do produto (Ativo/Inativo)
- **product_category**: Categoria (Serviço/Produto/Consultoria/etc.)

## Estrutura de Status Personalizado

```javascript
{
  id: "custom_1234567890_abc123",
  label: "Em Revisão",
  value: "em_revisao",
  color: "warning",
  description: "Status para itens em processo de revisão",
  type: "task_status",
  custom: true,
  created_at: "2024-01-01T00:00:00.000Z"
}
```

## Benefícios

1. **Reutilização**: Mesmo componente para todos os tipos de lista
2. **Consistência**: Comportamento uniforme em toda aplicação
3. **Flexibilidade**: Status personalizados por categoria
4. **UX**: Interface intuitiva e responsiva
5. **Manutenibilidade**: Código centralizado e organizizado
6. **Escalabilidade**: Fácil adição de novos tipos de status