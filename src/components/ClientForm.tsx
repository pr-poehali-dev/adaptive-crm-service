import { useState } from 'react';
import { useStore } from '@/store';
import { Client, ClientStatus, ProductType } from '@/types';
import Icon from '@/components/ui/icon';

const PRODUCT_TYPES: ProductType[] = ['Бытовка', 'Хозблок', 'Баня', 'Дачный домик', 'Другое'];
const STATUSES: ClientStatus[] = ['Заинтересован', 'Купил'];

interface Props {
  client?: Client | null;
  onClose: () => void;
}

export default function ClientForm({ client, onClose }: Props) {
  const { addClient, updateClient } = useStore();
  const [form, setForm] = useState({
    name: client?.name ?? '',
    product: client?.product ?? '',
    productType: (client?.productType ?? 'Бытовка') as ProductType,
    orderAmount: client?.orderAmount?.toString() ?? '',
    avitoLink: client?.avitoLink ?? '',
    phone: client?.phone ?? '',
    comment: client?.comment ?? '',
    status: (client?.status ?? 'Заинтересован') as ClientStatus,
    nextActionDate: client?.nextActionDate ?? new Date().toISOString().split('T')[0],
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      orderAmount: parseFloat(form.orderAmount) || 0,
    };
    if (client) {
      updateClient(client.id, data);
    } else {
      addClient(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-semibold text-base">{client ? 'Редактировать' : 'Новый клиент'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <Field label="Имя клиента *">
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Иван Иванов"
              className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Изделие *">
              <input required value={form.product} onChange={e => set('product', e.target.value)}
                placeholder="Бытовка 3х6"
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all" />
            </Field>
            <Field label="Тип изделия">
              <select value={form.productType} onChange={e => set('productType', e.target.value)}
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all">
                {PRODUCT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Сумма заказа (₽)">
              <input type="number" value={form.orderAmount} onChange={e => set('orderAmount', e.target.value)}
                placeholder="85000"
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all" />
            </Field>
            <Field label="Статус">
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Телефон">
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+7 999 123-45-67"
              className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all" />
          </Field>

          <Field label="Ссылка на чат Авито">
            <input type="url" value={form.avitoLink} onChange={e => set('avitoLink', e.target.value)}
              placeholder="https://avito.ru/..."
              className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all" />
          </Field>

          <Field label="Дата следующего действия">
            <input type="date" value={form.nextActionDate} onChange={e => set('nextActionDate', e.target.value)}
              className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all" />
          </Field>

          <Field label="Комментарий">
            <textarea value={form.comment} onChange={e => set('comment', e.target.value)}
              placeholder="Заметки о клиенте..."
              rows={3}
              className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all resize-none" />
          </Field>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-border transition-colors">
              Отмена
            </button>
            <button type="submit"
              className="flex-1 bg-foreground text-background rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity">
              {client ? 'Сохранить' : 'Добавить клиента'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
