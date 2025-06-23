import { useState, useEffect } from 'react';

const useCustomStatuses = () => {
  const [customStatuses, setCustomStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chave para localStorage
  const STORAGE_KEY = 'crm_custom_statuses';

  // Carregar status personalizados do localStorage
  const loadCustomStatuses = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCustomStatuses(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Erro ao carregar status personalizados:', error);
      setError('Erro ao carregar status personalizados');
    }
  };

  // Salvar status personalizados no localStorage
  const saveCustomStatuses = (statuses) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
      setCustomStatuses(statuses);
    } catch (error) {
      console.error('Erro ao salvar status personalizados:', error);
      setError('Erro ao salvar status personalizados');
    }
  };

  // Adicionar novo status personalizado
  const addCustomStatus = (newStatus) => {
    setLoading(true);
    setError(null);

    try {
      const statusWithId = {
        ...newStatus,
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        custom: true
      };

      const updatedStatuses = [...customStatuses, statusWithId];
      saveCustomStatuses(updatedStatuses);
      
      return statusWithId;
    } catch (error) {
      console.error('Erro ao adicionar status personalizado:', error);
      setError('Erro ao adicionar status personalizado');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Remover status personalizado
  const removeCustomStatus = (statusId) => {
    setLoading(true);
    setError(null);

    try {
      const updatedStatuses = customStatuses.filter(status => status.id !== statusId);
      saveCustomStatuses(updatedStatuses);
    } catch (error) {
      console.error('Erro ao remover status personalizado:', error);
      setError('Erro ao remover status personalizado');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar status personalizado
  const updateCustomStatus = (statusId, updates) => {
    setLoading(true);
    setError(null);

    try {
      const updatedStatuses = customStatuses.map(status =>
        status.id === statusId
          ? { ...status, ...updates, updated_at: new Date().toISOString() }
          : status
      );
      saveCustomStatuses(updatedStatuses);
    } catch (error) {
      console.error('Erro ao atualizar status personalizado:', error);
      setError('Erro ao atualizar status personalizado');
    } finally {
      setLoading(false);
    }
  };

  // Obter status personalizados por tipo
  const getCustomStatusesByType = (type) => {
    return customStatuses.filter(status => status.type === type);
  };

  // Verificar se um valor de status já existe
  const statusValueExists = (value, type, excludeId = null) => {
    return customStatuses.some(status => 
      status.value === value && 
      status.type === type && 
      status.id !== excludeId
    );
  };

  // Inicializar ao montar o componente
  useEffect(() => {
    loadCustomStatuses();
  }, []);

  return {
    customStatuses,
    loading,
    error,
    addCustomStatus,
    removeCustomStatus,
    updateCustomStatus,
    getCustomStatusesByType,
    statusValueExists,
    setError
  };
};

export default useCustomStatuses;