import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { Client, ClientStatus, ProductType } from '@/types';
import Icon from '@/components/ui/icon';
import ClientForm from '@/components/ClientForm';

const PRODUCT_TYPES: ProductType[] = ['Бытовка', 'Хозблок', 'Баня', 'Дачный домик', 'Другое'];

function fmt(n: number) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽';
}

export default function Clients() {
  const { state, deleteClient } = useStore();
  const { clients, settings } = state;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ProductType | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = !search
        || c.name.toLowerCase().includes(search.toLowerCase())
        || c.product.toLowerCase().includes(search.toLowerCase())
        || c.phone.includes(search);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchType = typeFilter === 'all' || c.productType === typeFilter;
      return matchSearch && matchStatus && matchType;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [clients, search, statusFilter, typeFilter]);

  if (state.loading) return <Loading />;

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Клиенты</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} из {clients.length}</p>
        </div>
        <button
          onClick={() => { setEditClient(null); setShowForm(true); }}
          className="bg-foreground text-background rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Icon name="Plus" size={16} />
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 animate-fade-in" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по имени, товару, телефону..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as ClientStatus | 'all')}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
        >
          <option value="all">Все статусы</option>
          <option value="Заинтересован">Заинтересован</option>
          <option value="Купил">Купил</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as ProductType | 'all')}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
        >
          <option value="all">Все типы</option>
          {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="text-left px-4 py-3 font-medium">Клиент</th>
              <th className="text-left px-4 py-3 font-medium">Изделие</th>
              <th className="text-left px-4 py-3 font-medium">Сумма</th>
              <th className="text-left px-4 py-3 font-medium">Прибыль</th>
              <th className="text-left px-4 py-3 font-medium">Статус</th>
              <th className="text-left px-4 py-3 font-medium">Следующий шаг</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">Клиентов не найдено</td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.phone}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{c.product}</div>
                  <div className="text-xs text-muted-foreground">{c.productType}</div>
                </td>
                <td className="px-4 py-3 font-mono-ibm">{fmt(c.orderAmount)}</td>
                <td className="px-4 py-3 font-mono-ibm text-muted-foreground">
                  {fmt(c.orderAmount * (settings.commissionPercent / 100))}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {c.nextActionDate
                    ? new Date(c.nextActionDate + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                        <Icon name="Phone" size={14} />
                      </a>
                    )}
                    {c.avitoLink && (
                      <a href={c.avitoLink} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                        <Icon name="ExternalLink" size={14} />
                      </a>
                    )}
                    <button onClick={() => { setEditClient(c); setShowForm(true); }} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                      <Icon name="Pencil" size={14} />
                    </button>
                    <button onClick={() => deleteClient(c.id)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-destructive">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">Клиентов не найдено</div>
        )}
        {filtered.map((c, i) => (
          <div key={c.id} className="animate-item" style={{ animationDelay: `${i * 30}ms` }}>
            <MobileClientCard
              client={c}
              commission={settings.commissionPercent}
              onEdit={() => { setEditClient(c); setShowForm(true); }}
              onDelete={() => deleteClient(c.id)}
            />
          </div>
        ))}
      </div>

      {showForm && (
        <ClientForm client={editClient} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
      status === 'Купил' ? 'badge-green' : 'badge-amber'
    }`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

function MobileClientCard({ client: c, commission, onEdit, onDelete }: {
  client: Client; commission: number; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 card-hover">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-medium text-sm">{c.name}</div>
          <div className="text-xs text-muted-foreground">{c.phone}</div>
        </div>
        <StatusBadge status={c.status} />
      </div>
      <div className="text-xs text-muted-foreground mb-2">{c.product} · {c.productType}</div>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium font-mono-ibm">
            {new Intl.NumberFormat('ru-RU').format(c.orderAmount)} ₽
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            → {new Intl.NumberFormat('ru-RU').format(Math.round(c.orderAmount * commission / 100))} ₽
          </span>
        </div>
        <div className="flex items-center gap-1">
          {c.phone && <a href={`tel:${c.phone}`} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground"><Icon name="Phone" size={14} /></a>}
          {c.avitoLink && <a href={c.avitoLink} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground"><Icon name="ExternalLink" size={14} /></a>}
          <button onClick={onEdit} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground"><Icon name="Pencil" size={14} /></button>
          <button onClick={onDelete} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-destructive"><Icon name="Trash2" size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
    </div>
  );
}
