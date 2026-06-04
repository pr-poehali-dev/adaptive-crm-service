import { useMemo, useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Client } from '@/types';
import Icon from '@/components/ui/icon';
import ClientForm from '@/components/ClientForm';

function fmt(n: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
}

function useMskCountdown() {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0, pct: 0 });
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const msk = new Date(utcMs + 3 * 3600000);
      const endOfDay = new Date(msk); endOfDay.setHours(23, 59, 59, 999);
      const remainMs = endOfDay.getTime() - msk.getTime();
      const elapsed = 86400000 - remainMs;
      setTime({
        hours: Math.floor(remainMs / 3600000),
        minutes: Math.floor((remainMs % 3600000) / 60000),
        seconds: Math.floor((remainMs % 60000) / 1000),
        pct: Math.round((elapsed / 86400000) * 100),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function Dashboard() {
  const { state, updateClient } = useStore();
  const { clients, settings } = state;
  const countdown = useMskCountdown();
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const buyers = clients.filter(c => c.status === 'Купил');
    const interested = clients.filter(c => c.status === 'Заинтересован');
    const turnover = buyers.reduce((s, c) => s + c.orderAmount, 0);
    const earned = turnover * (settings.commissionPercent / 100);
    const potential = interested.reduce((s, c) => s + c.orderAmount * (settings.commissionPercent / 100), 0);
    const conversion = clients.length > 0 ? Math.round((buyers.length / clients.length) * 100) : 0;
    return { turnover, earned, potential, interested: interested.length, buyers: buyers.length, conversion };
  }, [clients, settings]);

  const interested = clients.filter(c => c.status === 'Заинтересован');
  const buyers = clients.filter(c => c.status === 'Купил');

  const handleDrop = (status: 'Заинтересован' | 'Купил') => {
    if (dragging) { updateClient(dragging, { status } as Partial<Client>); }
    setDragging(null); setDragOver(null);
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  if (state.loading) return <LoadingScreen />;

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight">Главная</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Countdown */}
      <div className="mb-5 animate-fade-in" style={{ animationDelay: '60ms' }}>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Icon name="Timer" size={15} className="text-muted-foreground" />
              До конца дня (МСК)
            </div>
            <div className="font-mono-ibm text-xl font-semibold tabular-nums">
              {pad(countdown.hours)}:{pad(countdown.minutes)}
              <span className="text-muted-foreground text-base">:{pad(countdown.seconds)}</span>
            </div>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{
              width: `${countdown.pct}%`,
              background: countdown.pct > 85 ? 'hsl(var(--destructive))' : countdown.pct > 60 ? '#d97706' : 'hsl(var(--foreground))',
            }} />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>0:00</span><span>{countdown.pct}% прошло</span><span>23:59</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {[
          { label: 'Оборот', value: fmt(metrics.turnover), icon: 'TrendingUp', delay: 80 },
          { label: 'Заработано', value: fmt(metrics.earned), icon: 'Wallet', accent: true, delay: 120 },
          { label: 'Потенциал', value: fmt(metrics.potential), icon: 'Target', delay: 160 },
          { label: 'Конверсия', value: `${metrics.conversion}%`, icon: 'Percent', delay: 200 },
        ].map(m => (
          <div key={m.label} className="animate-fade-in" style={{ animationDelay: `${m.delay}ms` }}>
            <div className={`rounded-xl p-4 border card-hover ${m.accent ? 'bg-foreground text-background border-foreground' : 'bg-card border-border'}`}>
              <div className={`mb-2 ${m.accent ? 'opacity-60' : 'text-muted-foreground'}`}><Icon name={m.icon} size={15} /></div>
              <div className="text-xl font-semibold leading-tight">{m.value}</div>
              <div className={`text-xs mt-1 ${m.accent ? 'opacity-70' : 'text-muted-foreground'}`}>{m.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Заинтересованных', value: metrics.interested, delay: 220 },
          { label: 'Купили', value: metrics.buyers, delay: 260 },
          { label: 'Всего клиентов', value: clients.length, delay: 300 },
        ].map(m => (
          <div key={m.label} className="animate-fade-in" style={{ animationDelay: `${m.delay}ms` }}>
            <div className="bg-card border border-border rounded-xl p-4 card-hover">
              <div className="text-2xl font-semibold">{m.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div className="animate-fade-in" style={{ animationDelay: '320ms' }}>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Канбан</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Заинтересован */}
          <KanbanCol
            title="Заинтересован" count={interested.length}
            summary={`Потенциал: ${fmt(interested.reduce((s,c) => s + c.orderAmount * settings.commissionPercent / 100, 0))}`}
            colorClass="bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-400"
            badgeClass="bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400"
            isDragOver={dragOver === 'Заинтересован'}
            onDrop={() => handleDrop('Заинтересован')}
            onDragOver={e => { e.preventDefault(); setDragOver('Заинтересован'); }}
            onDragLeave={() => setDragOver(null)}
          >
            {interested.map((c, i) => (
              <div key={c.id} className="animate-item" style={{ animationDelay: `${i * 25}ms` }}>
                <KanbanCard client={c} commission={settings.commissionPercent}
                  onEdit={() => setEditClient(c)}
                  onMove={() => updateClient(c.id, { status: 'Купил' } as Partial<Client>)}
                  moveLabel="→ Купил"
                  onDragStart={() => setDragging(c.id)} />
              </div>
            ))}
            {interested.length === 0 && <EmptyCol text="Нет заинтересованных" />}
          </KanbanCol>

          {/* Купил */}
          <KanbanCol
            title="Купил" count={buyers.length}
            summary={`Заработано: ${fmt(buyers.reduce((s,c) => s + c.orderAmount * settings.commissionPercent / 100, 0))}`}
            colorClass="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-400"
            badgeClass="bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400"
            isDragOver={dragOver === 'Купил'}
            onDrop={() => handleDrop('Купил')}
            onDragOver={e => { e.preventDefault(); setDragOver('Купил'); }}
            onDragLeave={() => setDragOver(null)}
          >
            {buyers.map((c, i) => (
              <div key={c.id} className="animate-item" style={{ animationDelay: `${i * 25}ms` }}>
                <KanbanCard client={c} commission={settings.commissionPercent}
                  onEdit={() => setEditClient(c)}
                  onMove={() => updateClient(c.id, { status: 'Заинтересован' } as Partial<Client>)}
                  moveLabel="← Назад"
                  onDragStart={() => setDragging(c.id)} />
              </div>
            ))}
            {buyers.length === 0 && <EmptyCol text="Нет купивших" />}
          </KanbanCol>
        </div>
      </div>

      {editClient && <ClientForm client={editClient} onClose={() => setEditClient(null)} />}
    </div>
  );
}

function KanbanCol({ title, count, summary, colorClass, badgeClass, children, isDragOver, onDrop, onDragOver, onDragLeave }: {
  title: string; count: number; summary: string; colorClass: string; badgeClass: string;
  children: React.ReactNode; isDragOver: boolean;
  onDrop: () => void; onDragOver: (e: React.DragEvent) => void; onDragLeave: () => void;
}) {
  return (
    <div
      className={`bg-card border rounded-xl overflow-hidden transition-all duration-200 ${isDragOver ? 'ring-2 ring-foreground/30 scale-[1.01]' : 'border-border'}`}
      onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
    >
      <div className={`px-4 py-3 border-b border-border ${colorClass}`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{title}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>{count}</span>
        </div>
        <div className="text-xs opacity-70 mt-0.5">{summary}</div>
      </div>
      <div className="p-3 space-y-2 min-h-36 max-h-80 overflow-y-auto">{children}</div>
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

  const copyPhone = () => {
    if (c.phone) navigator.clipboard.writeText(c.phone);
  };

  return (
    <div draggable onDragStart={onDragStart}
      className="bg-background border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-foreground/20 hover:shadow-sm transition-all duration-150">
      <div className="flex items-start justify-between mb-1">
        <div className="font-medium text-sm leading-tight">{c.name}</div>
        <button onClick={onEdit} className="text-muted-foreground hover:text-foreground p-0.5 ml-1 shrink-0">
          <Icon name="Pencil" size={12} />
        </button>
      </div>
      <div className="text-xs text-muted-foreground mb-2">{c.product}</div>
      {c.comment && (
        <div className="text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 rounded-lg px-2 py-1.5 mb-2 leading-snug">
          {c.comment}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium font-mono-ibm">
            {new Intl.NumberFormat('ru-RU').format(c.orderAmount)} ₽
          </div>
          <div className="text-xs text-muted-foreground">
            {new Intl.NumberFormat('ru-RU').format(Math.round(c.orderAmount * commission / 100))} ₽
          </div>
        </div>
        {c.nextActionDate && (
          <div className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
            isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
            isToday ? 'badge-blue' : 'bg-secondary text-muted-foreground'
          }`}>
            {new Date(c.nextActionDate + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border">
        {c.phone && (
          <button onClick={copyPhone} title="Копировать номер"
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary">
            <Icon name="Phone" size={13} />
          </button>
        )}
        {c.avitoLink && (
          <a href={c.avitoLink} target="_blank" rel="noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary">
            <Icon name="ExternalLink" size={13} />
          </a>
        )}
        <button onClick={onMove}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-0.5 hover:border-foreground/30 hover:bg-secondary transition-all">
          {moveLabel}
        </button>
      </div>
    </div>
  );
}

function EmptyCol({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
      <Icon name="Inbox" size={22} className="mb-1.5 opacity-20" />{text}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
        <span className="text-sm">Загрузка…</span>
      </div>
    </div>
  );
}
