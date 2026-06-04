import { useState, useEffect, useCallback } from 'react';
import { Client, Task, Settings, AppState } from './types';

const STORAGE_KEY = 'dacha_crm_data';

const defaultSettings: Settings = {
  commissionPercent: 5,
  userName: 'Менеджер',
};

const sampleClients: Client[] = [
  {
    id: '1',
    name: 'Алексей Петров',
    product: 'Бытовка 3х6 с окном',
    productType: 'Бытовка',
    orderAmount: 85000,
    avitoLink: 'https://avito.ru',
    phone: '+7 999 123-45-67',
    comment: 'Интересует доставка до Подольска',
    status: 'Заинтересован',
    nextActionDate: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Марина Иванова',
    product: 'Баня 4х6 из бруса',
    productType: 'Баня',
    orderAmount: 320000,
    avitoLink: 'https://avito.ru',
    phone: '+7 915 987-65-43',
    comment: 'Готова к покупке, ждёт расчёт фундамента',
    status: 'Заинтересован',
    nextActionDate: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Дмитрий Сидоров',
    product: 'Хозблок 2х3',
    productType: 'Хозблок',
    orderAmount: 55000,
    avitoLink: 'https://avito.ru',
    phone: '+7 926 555-12-34',
    comment: 'Оплатил предоплату',
    status: 'Купил',
    nextActionDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: '4',
    name: 'Светлана Козлова',
    product: 'Дачный домик 6х6',
    productType: 'Дачный домик',
    orderAmount: 480000,
    avitoLink: 'https://avito.ru',
    phone: '+7 903 444-88-99',
    comment: 'Полная оплата получена',
    status: 'Купил',
    nextActionDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Отправить КП Алексею Петрову',
    clientId: '1',
    dueDate: new Date().toISOString().split('T')[0],
    done: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Уточнить сроки доставки у Марины',
    clientId: '2',
    dueDate: new Date().toISOString().split('T')[0],
    done: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Позвонить по новому лиду с Авито',
    dueDate: new Date().toISOString().split('T')[0],
    done: true,
    createdAt: new Date().toISOString(),
  },
];

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_e) {
    // ignore parse errors
  }
  return { clients: sampleClients, tasks: sampleTasks, settings: defaultSettings };
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useStore() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const addClient = useCallback((client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    setState(s => ({
      ...s,
      clients: [...s.clients, {
        ...client,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
    }));
  }, []);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    setState(s => ({
      ...s,
      clients: s.clients.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c),
    }));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setState(s => ({ ...s, clients: s.clients.filter(c => c.id !== id) }));
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    setState(s => ({
      ...s,
      tasks: [...s.tasks, { ...task, id: Date.now().toString(), createdAt: new Date().toISOString() }],
    }));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) }));
  }, []);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...updates } }));
  }, []);

  return { state, addClient, updateClient, deleteClient, addTask, updateTask, deleteTask, updateSettings };
}