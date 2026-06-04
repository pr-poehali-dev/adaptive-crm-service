import { useState, useEffect, useCallback } from 'react';
import { Client, Task, Settings } from './types';

const API = 'https://functions.poehali.dev/9b14d63d-0742-4f86-8fbb-4873aad98055';
const COMMISSION = 5;

export interface AppState {
  clients: Client[];
  tasks: Task[];
  settings: Settings;
  loading: boolean;
}

function mapClient(r: Record<string, unknown>): Client {
  return {
    id: r.id as string,
    name: r.name as string,
    product: r.product as string,
    productType: r.product_type as Client['productType'],
    orderAmount: Number(r.order_amount),
    avitoLink: r.avito_link as string,
    phone: r.phone as string,
    comment: r.comment as string,
    status: r.status as Client['status'],
    nextActionDate: r.next_action_date as string ?? '',
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapTask(r: Record<string, unknown>): Task {
  return {
    id: r.id as string,
    title: r.title as string,
    clientId: r.client_id as string | undefined,
    dueDate: r.due_date as string,
    done: r.done as boolean,
    createdAt: r.created_at as string,
  };
}

async function apiFetch(path: string, method = 'GET', body?: unknown) {
  try {
    const res = await fetch(API + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  } catch (e) {
    console.error('Fetch error:', e, 'for', API + path);
    return null;
  }
}

const defaultSettings: Settings = { commissionPercent: COMMISSION, userName: '' };

export function useStore() {
  const [state, setState] = useState<AppState>({
    clients: [], tasks: [], settings: defaultSettings, loading: true,
  });

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    const [clients, tasks] = await Promise.all([
      apiFetch('/clients'),
      apiFetch('/tasks'),
    ]);
    setState(s => ({
      ...s,
      clients: Array.isArray(clients) ? clients.map(mapClient) : s.clients,
      tasks: Array.isArray(tasks) ? tasks.map(mapTask) : s.tasks,
      settings: { commissionPercent: COMMISSION, userName: '' },
      loading: false,
    }));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addClient = useCallback(async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const row = await apiFetch('/clients', 'POST', client);
    if (row?.id) {
      setState(s => ({ ...s, clients: [mapClient(row), ...s.clients] }));
    }
  }, []);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    // Merge with existing local state — no extra GET needed
    setState(s => {
      const existing = s.clients.find(c => c.id === id);
      if (!existing) return s;
      const merged = { ...existing, ...updates };
      // Fire PUT in background
      apiFetch(`/clients/${id}`, 'PUT', merged).then(row => {
        if (row?.id) {
          setState(s2 => ({ ...s2, clients: s2.clients.map(c => c.id === id ? mapClient(row) : c) }));
        }
      });
      return { ...s, clients: s.clients.map(c => c.id === id ? merged : c) };
    });
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    await apiFetch(`/clients/${id}`, 'DELETE');
    setState(s => ({ ...s, clients: s.clients.filter(c => c.id !== id) }));
  }, []);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt'>) => {
    const row = await apiFetch('/tasks', 'POST', task);
    if (row?.id) {
      setState(s => ({ ...s, tasks: [...s.tasks, mapTask(row)] }));
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const existing = state.tasks.find(t => t.id === id);
    if (!existing) return;
    const merged = { ...existing, ...updates };
    const row = await apiFetch(`/tasks/${id}`, 'PUT', merged);
    if (row?.id) {
      setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? mapTask(row) : t) }));
    }
  }, [state.tasks]);

  const deleteTask = useCallback(async (id: string) => {
    await apiFetch(`/tasks/${id}`, 'DELETE');
    setState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) }));
  }, []);

  const updateSettings = useCallback((_updates: Partial<Settings>) => {
    // commission is fixed
  }, []);

  return { state, load, addClient, updateClient, deleteClient, addTask, updateTask, deleteTask, updateSettings };
}