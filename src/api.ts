import func2url from '../backend/func2url.json';

const BASE = (func2url as Record<string, string>)['crm-api'];

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text as unknown as T; }
}

// --- Clients ---
export const getClients = () => req<RawClient[]>('GET', '/clients');
export const createClient = (data: ClientPayload) => req<RawClient>('POST', '/clients', data);
export const updateClient = (id: string, data: ClientPayload) => req<RawClient>('PUT', `/clients/${id}`, data);
export const deleteClient = (id: string) => req<{ deleted: string }>('DELETE', `/clients/${id}`);

// --- Tasks ---
export const getTasks = () => req<RawTask[]>('GET', '/tasks');
export const createTask = (data: TaskPayload) => req<RawTask>('POST', '/tasks', data);
export const updateTask = (id: string, data: TaskPayload) => req<RawTask>('PUT', `/tasks/${id}`, data);
export const deleteTask = (id: string) => req<{ deleted: string }>('DELETE', `/tasks/${id}`);

// --- Settings ---
export const getSettings = () => req<RawSettings>('GET', '/settings');
export const saveSettings = (data: { userName: string }) => req<RawSettings>('PUT', '/settings', data);

// --- Types (raw DB rows) ---
export interface RawClient {
  id: string;
  name: string;
  product: string;
  product_type: string;
  order_amount: string | number;
  avito_link: string;
  phone: string;
  comment: string;
  status: string;
  next_action_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface RawTask {
  id: string;
  title: string;
  client_id: string | null;
  due_date: string;
  done: boolean;
  created_at: string;
}

export interface RawSettings {
  id: number;
  user_name: string;
  commission_percent: string | number;
}

export interface ClientPayload {
  name: string;
  product: string;
  productType: string;
  orderAmount: number;
  avitoLink: string;
  phone: string;
  comment: string;
  status: string;
  nextActionDate: string | null;
}

export interface TaskPayload {
  title: string;
  clientId: string | null;
  dueDate: string;
  done: boolean;
}
