import { useState } from 'react';
import { useStore } from '@/store';
import { Client, ClientStatus, ProductType } from '@/types';
import Icon from '@/components/ui/icon';

const PRODUCT_TYPES: ProductType[] = ['Бытовка', 'Хозблок', 'Баня', 'Дачный домик', 'Другое'];
const STATUSES: ClientStatus[] = ['Заинтересован', 'Купил'];

interface Props { client?: Client | null; onClose: () => void; }

export default function ClientForm({ client, onClose }: Props) {
  const { addClient, updateClient } = useStore();
  const [saving, setSaving] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, orderAmount: parseFloat(form.orderAmount) || 0 };
    if (client) {
      await updateClient(client.id, data);
    } else {
      await addClient(data);
    }
    setSaving(false);
    onClose();
  };

  const inp = "w-full bg-secondary rounded-xl px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="font-semibold">{client ? 'Редактирование' : 'Новый клиент'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 -mr-1.5 rounded-xl hover:bg-secondary transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-3.5">
            <F label="Имя клиента *">
              <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Иван Иванов" className={inp} />
            </F>

            <div className="grid grid-cols-2 gap-3">
              <F label="Изделие *">
                <input required value={form.product} onChange={e => set('product', e.target.value)} placeholder="Бытовка 3×6" className={inp} />
              </F>
              <F label="Тип">
                <select value={form.productType} onChange={e => set('productType', e.target.value)} className={inp}>
                  {PRODUCT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </F>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <F label="Сумма (₽)">
                <input type="number" value={form.orderAmount} onChange={e => set('orderAmount', e.target.value)} placeholder="85000" className={inp} />
              </F>
              <F label="Статус">
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inp}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </F>
            </div>

            <F label="Телефон">
              <div className="relative">
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+7 999 123-45-67" className={inp + ' pr-10'} />
                {form.phone && (
                  <button type="button" onClick={() => navigator.clipboard.writeText(form.phone)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="Copy" size={14} />
                  </button>
                )}
              </div>
            </F>

            <F label="Ссылка Авито">
              <input type="url" value={form.avitoLink} onChange={e => set('avitoLink', e.target.value)} placeholder="https://avito.ru/..." className={inp} />
            </F>

            <F label="Дата контакта">
              <input type="date" value={form.nextActionDate} onChange={e => set('nextActionDate', e.target.value)} className={inp} />
            </F>

            <F label="Комментарий">
              <textarea value={form.comment} onChange={e => set('comment', e.target.value)}
                placeholder="Заметки о клиенте..." rows={3}
                className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300/40 transition-all resize-none text-amber-900 dark:text-amber-200 placeholder:text-amber-400" />
            </F>
          </div>

          <div className="px-5 py-4 border-t border-border flex gap-3 sticky bottom-0 bg-card shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 bg-secondary rounded-xl py-3 text-sm font-medium hover:bg-border transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-foreground text-background rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />}
              {client ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
