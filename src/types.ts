export type ProductType = 'Бытовка' | 'Хозблок' | 'Баня' | 'Дачный домик' | 'Другое';

export type ClientStatus = 'Заинтересован' | 'Купил';

export interface Client {
  id: string;
  name: string;
  product: string;
  productType: ProductType;
  orderAmount: number;
  avitoLink: string;
  phone: string;
  comment: string;
  status: ClientStatus;
  nextActionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  clientId?: string;
  dueDate: string;
  done: boolean;
  createdAt: string;
}

export interface Settings {
  commissionPercent: number;
  userName: string;
}

export interface AppState {
  clients: Client[];
  tasks: Task[];
  settings: Settings;
}
