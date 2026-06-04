import { useState } from 'react';
import { useStore } from '@/store';
import { Client } from '@/types';
import Icon from '@/components/ui/icon';
import ClientForm from '@/components/ClientForm';

function fmt(n: number) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽';
}

export default function Kanban() {
  const { state, updateClient } = useStore();
  const { clients, settings } = state;
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const interested = clients.filter(c => c.status === 'Заинтересован');
  const buyers = clients.filter(c => c.status === 'Купил');

  const interestTotal = interested.reduce((s, c) => s + c.orderAmount, 0);
  const buyersTotal = buyers.reduce((s, c) => s + c.orderAmount, 0);

  const handleDrop = (status: 'Заинтересован' | 'Купил') => {
    if (dragging) {
      updateClient(dragging, { status } as Partial<Client>);
      setDragging(null);
      setDragOver(null);
    }
  };

  const moveToStatus = (id: string, status: 'Заинтересован' | 'Купил') => {
    updateClient(id, { status } as Partial<Client>);
  };

  if (state.loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight">Канбан</h1>
        <p className="text-muted-foreground text-sm mt-1">Перетаскивайте карточки или используйте кнопки</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Заинтересован */}
        <div
          className={`bg-card border rounded-xl overflow-hidden transition-all duration-200 animate-fade-in ${
            dragOver === 'Заинтересован' ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-border'
          }`}
          style={{ animationDelay: '60ms' }}
          onDrop={() => handleDrop('Заинтересован')}
          onDragOver={e => { e.preventDefault(); setDragOver('Заинтересован'); }}
          onDragLeave={() => setDragOver(null)}
        >
          <div className="px-4 py-3 border-b border-border bg-amber-50 dark:bg-amber-900/10">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm text-amber-800 dark:text-amber-400">Заинтересован</div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400">
                {interested.length}
              </span>
            </div>
            <div className="text-xs text-amber-700/70 dark:text-amber-400/60 mt-1">
              Потенциал: {fmt(interestTotal * settings.commissionPercent / 100)}
            </div>
          </div>
          <div className="p-3 space-y-2 min-h-48">
            {interested.map((c, i) => (
              <div key={c.id} className="animate-item" style={{ animationDelay: `${i * 30}ms` }}>
                <KanbanCard
                  client={c}
                  commission={settings.commissionPercent}
                  onEdit={() => setEditClient(c)}
                  onMove={() => moveToStatus(c.id, 'Купил')}
                  moveLabel="→ Купил"
                  onDragStart={() => setDragging(c.id)}
                />
              </div>
            ))}
            {interested.length === 0 && <EmptyCol text="Нет заинтересованных" />}
          </div>
        </div>

        {/* Купил */}
        <div
          className={`bg-card border rounded-xl overflow-hidden transition-all duration-200 animate-fade-in ${
            dragOver === 'Купил' ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-border'
          }`}
          style={{ animationDelay: '100ms' }}
          onDrop={() => handleDrop('Купил')}
          onDragOver={e => { e.preventDefault(); setDragOver('Купил'); }}
          onDragLeave={() => setDragOver(null)}
        >
          <div className="px-4 py-3 border-b border-border bg-emerald-50 dark:bg-emerald-900/10">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm text-emerald-800 dark:text-emerald-400">Купил</div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                {buyers.length}
              </span>
            </div>
            <div className="text-xs text-emerald-700/70 dark:text-emerald-400/60 mt-1">
              Заработано: {fmt(buyersTotal * settings.commissionPercent / 100)}
            </div>
          </div>
          <div className="p-3 space-y-2 min-h-48">
            {buyers.map((c, i) => (
              <div key={c.id} className="animate-item" style={{ animationDelay: `${i * 30}ms` }}>
                <KanbanCard
                  client={c}
                  commission={settings.commissionPercent}
                  onEdit={() => setEditClient(c)}
                  onMove={() => moveToStatus(c.id, 'Заинтересован')}
                  moveLabel="← Назад"
                  onDragStart={() => setDragging(c.id)}
                />
              </div>
            ))}
            {buyers.length === 0 && <EmptyCol text="Нет купивших" />}
          </div>
        </div>
      </div>

      {editClient && (
        <ClientForm client={editClient} onClose={() => setEditClient(null)} />
      )}
    </div>
  );
}

function KanbanCard({ client: c, commission, onEdit, onMove, moveLabel, onDragStart }: {
  client: Client; commission: number; onEdit: () => void;
  onMove: () => void; moveLabel: string; onDragStart: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const isToday = c.nextActionDate === today;
  const isOverdue = c.nextActionDate && c.nextActionDate < today;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-background border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-foreground/25 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="font-medium text-sm leading-tight">{c.name}</div>
        <button onClick={onEdit} className="text-muted-foreground hover:text-foreground transition-colors p-0.5 ml-1 shrink-0">
          <Icon name="Pencil" size={12} />
        </button>
      </div>
      <div className="text-xs text-muted-foreground mb-2">{c.product}</div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium font-mono-ibm">{new Intl.NumberFormat('ru-RU').format(c.orderAmount)} ₽</div>
          <div className="text-xs text-muted-foreground">
            {new Intl.NumberFormat('ru-RU').format(Math.round(c.orderAmount * commission / 100))} ₽ прибыль
          </div>
        </div>
        {c.nextActionDate && (
          <div className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
            isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
            isToday ? 'badge-blue' :
            'bg-secondary text-muted-foreground'
          }`}>
            {new Date(c.nextActionDate + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </div>
        )}
      </div>
      {c.comment && (
        <div className="text-xs text-muted-foreground mt-2 truncate">{c.comment}</div>
      )}
      <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border">
        {c.phone && (
          <a href={`tel:${c.phone}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="Phone" size={13} />
          </a>
        )}
        {c.avitoLink && (
          <a href={c.avitoLink} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ExternalLink" size={13} />
          </a>
        )}
        <button
          onClick={onMove}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-2 py-0.5 hover:border-foreground/30 hover:bg-secondary"
        >
          {moveLabel}
        </button>
      </div>
    </div>
  );
}

function EmptyCol({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
      <Icon name="Inbox" size={24} className="mb-2 opacity-20" />
      {text}
    </div>
  );
}
