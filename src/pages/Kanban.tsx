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

  const interested = clients.filter(c => c.status === 'Заинтересован');
  const buyers = clients.filter(c => c.status === 'Купил');

  const interestTotal = interested.reduce((s, c) => s + c.orderAmount, 0);
  const buyersTotal = buyers.reduce((s, c) => s + c.orderAmount, 0);

  const handleDrop = (status: 'Заинтересован' | 'Купил') => {
    if (dragging) {
      updateClient(dragging, { status });
      setDragging(null);
    }
  };

  const moveToStatus = (id: string, status: 'Заинтересован' | 'Купил') => {
    updateClient(id, { status });
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Канбан</h1>
        <p className="text-muted-foreground text-sm mt-1">Перетаскивайте карточки или используйте кнопки</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Заинтересован */}
        <Column
          title="Заинтересован"
          count={interested.length}
          total={interestTotal}
          label={`Потенциал: ${fmt(interestTotal * settings.commissionPercent / 100)}`}
          color="secondary"
          onDrop={() => handleDrop('Заинтересован')}
          onDragOver={e => e.preventDefault()}
        >
          {interested.map(c => (
            <KanbanCard
              key={c.id}
              client={c}
              commission={settings.commissionPercent}
              onEdit={() => setEditClient(c)}
              onMove={() => moveToStatus(c.id, 'Купил')}
              moveLabel="→ Купил"
              onDragStart={() => setDragging(c.id)}
            />
          ))}
          {interested.length === 0 && <EmptyCol text="Нет заинтересованных" />}
        </Column>

        {/* Купил */}
        <Column
          title="Купил"
          count={buyers.length}
          total={buyersTotal}
          label={`Заработано: ${fmt(buyersTotal * settings.commissionPercent / 100)}`}
          color="foreground"
          onDrop={() => handleDrop('Купил')}
          onDragOver={e => e.preventDefault()}
        >
          {buyers.map(c => (
            <KanbanCard
              key={c.id}
              client={c}
              commission={settings.commissionPercent}
              onEdit={() => setEditClient(c)}
              onMove={() => moveToStatus(c.id, 'Заинтересован')}
              moveLabel="← Назад"
              onDragStart={() => setDragging(c.id)}
            />
          ))}
          {buyers.length === 0 && <EmptyCol text="Нет купивших" />}
        </Column>
      </div>

      {editClient && (
        <ClientForm client={editClient} onClose={() => setEditClient(null)} />
      )}
    </div>
  );
}

function Column({ title, count, total, label, color, children, onDrop, onDragOver }: {
  title: string; count: number; total: number; label: string; color: string;
  children: React.ReactNode; onDrop: () => void; onDragOver: (e: React.DragEvent) => void;
}) {
  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div className={`px-4 py-3 border-b border-border ${color === 'foreground' ? 'bg-foreground' : 'bg-secondary'}`}>
        <div className="flex items-center justify-between">
          <div className={`font-semibold text-sm ${color === 'foreground' ? 'text-background' : 'text-foreground'}`}>
            {title}
          </div>
          <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${color === 'foreground' ? 'bg-background/20 text-background' : 'bg-border text-muted-foreground'}`}>
            {count}
          </div>
        </div>
        <div className={`text-xs mt-1 ${color === 'foreground' ? 'text-background/70' : 'text-muted-foreground'}`}>
          {label}
        </div>
      </div>
      <div className="p-3 space-y-2 min-h-48">
        {children}
      </div>
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
      className="bg-background border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-foreground/30 transition-all"
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
          <div className={`text-xs px-2 py-0.5 rounded-lg ${
            isOverdue ? 'bg-destructive/10 text-destructive' :
            isToday ? 'bg-foreground/10 text-foreground font-medium' :
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
          <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="Phone" size={12} />
          </a>
        )}
        {c.avitoLink && (
          <a href={c.avitoLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ExternalLink" size={12} />
          </a>
        )}
        <button
          onClick={onMove}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-2 py-0.5 hover:border-foreground/30"
        >
          {moveLabel}
        </button>
      </div>
    </div>
  );
}

function EmptyCol({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
      <Icon name="Inbox" size={24} className="mb-2 opacity-30" />
      {text}
    </div>
  );
}
