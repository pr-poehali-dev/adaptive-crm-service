import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { Client, ClientStatus, ProductType } from '@/types';
import Icon from '@/components/ui/icon';
import ClientForm from '@/components/ClientForm';

const PRODUCT_TYPES: ProductType[] = ['Бытовка', 'Хозблок', 'Баня', 'Дачный домик', 'Другое'];

function fmt(n: number) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽';
}

function fmtShort(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + ' млн';
  if (n >= 1000) return Math.round(n / 1000) + ' тыс';
  return String(n);
}

export default function Clients() {
  const { state, deleteClient } = useStore();
  const { clients, settings } = state;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.product.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [clients, search, statusFilter]);

  const totals = useMemo(() => ({
    turnover: filtered.reduce((s, c) => s + c.orderAmount, 0),
    profit: filtered.reduce((s, c) => s + c.orderAmount * settings.commissionPercent / 100, 0),
  }), [filtered, settings.commissionPercent]);

  if (state.loading) return <Loading />;

  return (
    <div className="px-4 md:px-8 py-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4 animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Клиенты</h1>
          <p className="text-muted-foreground text-xs mt-0.5">{filtered.length} из {clients.length}</p>
        </div>
        <button onClick={() => { setEditClient(null); setShowForm(true); }}
          className="bg-foreground text-background rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
          <Icon name="Plus" size={16} />
          Добавить
        </button>
      </div>

      <div className="flex gap-2 mb-3 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div className="relative flex-1">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ClientStatus | 'all')}
          className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all shrink-0">
          <option value="all">Все</option>
          <option value="Заинтересован">Интерес</option>
          <option value="Составили ТЗ">Составили ТЗ</option>
          <option value="Купил">Купил</option>
        </select>
      </div>

      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 mb-4 animate-fade-in" style={{ animationDelay: '70ms' }}>
          <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Оборот</span>
            <span className="text-sm font-semibold font-mono-ibm">{fmt(totals.turnover)}</span>
          </div>
          <div className="bg-foreground text-background rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs opacity-70">Прибыль</span>
            <span className="text-sm font-semibold font-mono-ibm">{fmt(totals.profit)}</span>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="Users" size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">Клиентов не найдено</p>
        </div>
      )}

      <div className="space-y-2.5">
        {filtered.map((c, i) => (
          <ClientCard key={c.id} client={c} commission={settings.commissionPercent} index={i}
            onEdit={() => { setEditClient(c); setShowForm(true); }}
            onDelete={() => deleteClient(c.id)} />
        ))}
      </div>

      {showForm && <ClientForm client={editClient} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function ClientCard({ client: c, commission, index, onEdit, onDelete }: {
  client: Client; commission: number; index: number; onEdit: () => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const profit = Math.round(c.orderAmount * commission / 100);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden animate-item" style={{ animationDelay: `${index * 30}ms` }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{c.name}</span>
              <StatusBadge status={c.status} />
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 truncate">{c.product} · {c.productType}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-semibold font-mono-ibm">{new Intl.NumberFormat('ru-RU').format(c.orderAmount)} ₽</div>
            <div className="text-xs text-muted-foreground">→ {new Intl.NumberFormat('ru-RU').format(profit)} ₽</div>
          </div>
        </div>

        {c.comment && (
          <div className="mt-2.5 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 text-amber-800 dark:text-amber-300 rounded-lg px-2.5 py-2 leading-snug">
            {c.comment}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border">
          {c.phone && (
            <button onClick={() => navigator.clipboard.writeText(c.phone)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-secondary rounded-lg px-2.5 py-1.5">
              <Icon name="Phone" size={12} />
              <span className="font-mono-ibm">{c.phone}</span>
            </button>
          )}
          {c.nextActionDate && (
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(c.nextActionDate + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>

      <div className="flex border-t border-border">
        {c.avitoLink && (
          <a href={c.avitoLink} target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border-r border-border">
            <Icon name="ExternalLink" size={13} />Авито
          </a>
        )}
        <button onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border-r border-border">
          <Icon name="Pencil" size={13} />Изменить
        </button>
        <button onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
          <Icon name="Trash2" size={13} />Удалить
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ClientStatus }) {
  const cls = status === 'Купил' ? 'badge-green' : status === 'Составили ТЗ' ? 'badge-blue' : 'badge-amber';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />{status}
    </span>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
    </div>
  );
}