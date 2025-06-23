import { useState, useEffect } from 'react';

const STORAGE_KEY = 'product_categories';

// Categorias padrão
const DEFAULT_CATEGORIES = [
  { value: 'servico', label: 'Serviço', color: 'primary' },
  { value: 'produto', label: 'Produto', color: 'secondary' },
  { value: 'consultoria', label: 'Consultoria', color: 'info' },
  { value: 'treinamento', label: 'Treinamento', color: 'warning' },
  { value: 'marketing', label: 'Marketing', color: 'success' },
  { value: 'tecnologia', label: 'Tecnologia', color: 'error' }
];

export const useProductCategories = () => {
  const [categories, setCategories] = useState([]);

  // Carregar categorias do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCategories(parsed);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        setCategories(DEFAULT_CATEGORIES);
      }
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  // Salvar categorias no localStorage
  const saveCategories = (newCategories) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
      setCategories(newCategories);
    } catch (error) {
      console.error('Erro ao salvar categorias:', error);
    }
  };

  // Adicionar nova categoria
  const addCategory = (category) => {
    const newCategory = {
      value: category.value || category.label.toLowerCase().replace(/\s+/g, '_'),
      label: category.label,
      color: category.color || 'default'
    };

    // Verificar se já existe
    const exists = categories.some(cat => 
      cat.value === newCategory.value || cat.label === newCategory.label
    );

    if (exists) {
      throw new Error('Categoria já existe');
    }

    const updatedCategories = [...categories, newCategory];
    saveCategories(updatedCategories);
    return newCategory;
  };

  // Remover categoria
  const removeCategory = (categoryValue) => {
    const updatedCategories = categories.filter(cat => cat.value !== categoryValue);
    saveCategories(updatedCategories);
  };

  // Atualizar categoria
  const updateCategory = (categoryValue, updates) => {
    const updatedCategories = categories.map(cat => 
      cat.value === categoryValue ? { ...cat, ...updates } : cat
    );
    saveCategories(updatedCategories);
  };

  // Obter categoria por valor
  const getCategoryByValue = (value) => {
    return categories.find(cat => cat.value === value);
  };

  // Obter cor da categoria
  const getCategoryColor = (value) => {
    const category = getCategoryByValue(value);
    return category?.color || 'default';
  };

  // Resetar para categorias padrão
  const resetToDefault = () => {
    saveCategories(DEFAULT_CATEGORIES);
  };

  return {
    categories,
    addCategory,
    removeCategory,
    updateCategory,
    getCategoryByValue,
    getCategoryColor,
    resetToDefault,
    defaultCategories: DEFAULT_CATEGORIES
  };
};