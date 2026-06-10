import { useMemo, useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Client } from '@/types';
import Icon from '@/components/ui/icon';
import ClientForm from '@/components/ClientForm';

function fmtMoney(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + ' млн ₽';
  if (n >= 1000) return Math.round(n / 1000) + ' тыс ₽';
  return n + ' ₽';
}

function useMskCountdown() {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0, pct: 0 });
  useEffect(() => {
    const calc = () => {
      const utcMs = Date.now() + new Date().getTimezoneOffset() * 60000;
      const msk = new Date(utcMs + 3 * 3600000);
      const rem = (23 - msk.getHours()) * 3600000 + (59 - msk.getMinutes()) * 60000 + (59 - msk.getSeconds()) * 1000;
      setTime({ h: Math.floor(rem / 3600000), m: Math.floor((rem % 3600000) / 60000), s: Math.floor((rem % 60000) / 1000), pct: Math.round(((86400000 - rem) / 86400000) * 100) });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const p2 = (n: number) => String(n).padStart(2, '0');

export default function Dashboard() {
  const { state, updateClient } = useStore();
  const { clients, settings } = state;
  const cd = useMskCountdown();
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const m = useMemo(() => {
    const b = clients.filter(c => c.status === 'Купил');
    const i = clients.filter(c => c.status === 'Заинтересован');
    const t = b.reduce((s, c) => s + c.orderAmount, 0);
    const cp = settings.commissionPercent / 100;
    return { turnover: t, earned: t * cp, potential: i.reduce((s, c) => s + c.orderAmount * cp, 0), conversion: clients.length > 0 ? Math.round(b.length / clients.length * 100) : 0, buyersCount: b.length, intCount: i.length };
  }, [clients, settings]);

  const interested = clients.filter(c => c.status === 'Заинтересован');
  const buyers = clients.filter(c => c.status === 'Купил');
  const move = (id: string, status: Client['status']) => { updateClient(id, { status }); setDragging(null); setDragOver(null); };

  if (state.loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-4 md:px-8 py-5 max-w-5xl mx-auto space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-xl font-semibold tracking-tight">Главная</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-3.5 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Icon name="Timer" size={14} className="text-muted-foreground" />
            До конца дня (МСК)
          </div>
          <div className="font-mono-ibm font-semibold tabular-nums text-lg leading-none">
            {p2(cd.h)}:{p2(cd.m)}<span className="text-muted-foreground text-sm">:{p2(cd.s)}</span>
          </div>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${cd.pct}%`, background: cd.pct > 85 ? 'hsl(var(--destructive))' : cd.pct > 65 ? '#d97706' : 'hsl(var(--foreground))' }} />
        </div>
        <div className="text-[10px] text-muted-foreground mt-1 text-right">{cd.pct}% дня прошло</div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 animate-fade-in" style={{ animationDelay: '80ms' }}>
        <div className="bg-foreground text-background rounded-xl p-3.5">
          <div className="text-[11px] opacity-60 mb-1">Заработано</div>
          <div className="text-lg font-semibold leading-tight">{fmtMoney(m.earned)}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3.5">
          <div className="text-[11px] text-muted-foreground mb-1">Потенциал</div>
          <div className="text-lg font-semibold leading-tight">{fmtMoney(m.potential)}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3.5">
          <div className="text-[11px] text-muted-foreground mb-1">Оборот</div>
          <div className="text-lg font-semibold leading-tight">{fmtMoney(m.turnover)}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3.5">
          <div className="text-[11px] text-muted-foreground mb-1">Конверсия</div>
          <div className="text-lg font-semibold leading-tight">{m.conversion}%</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 animate-fade-in" style={{ animationDelay: '110ms' }}>
        {[{ label: 'Заинтересованы', value: m.intCount }, { label: 'Купили', value: m.buyersCount }, { label: 'Всего', value: clients.length }].map(item => (
          <div key={item.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '140ms' }}>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Канбан</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <KanbanCol title="Заинтересован" count={interested.length}
            summary={`Потенциал: ${fmtMoney(interested.reduce((s, c) => s + c.orderAmount * settings.commissionPercent / 100, 0))}`}
            colorClass="bg-amber-50 dark:bg-amber-900/10" titleClass="text-amber-800 dark:text-amber-400"
            badgeClass="bg-amber-200/80 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400"
            isDragOver={dragOver === 'Заинтересован'}
            onDrop={() => { if (dragging) move(dragging, 'Заинтересован'); }}
            onDragOver={e => { e.preventDefault(); setDragOver('Заинтересован'); }}
            onDragLeave={() => setDragOver(null)}>
            {interested.map((c, i) => <KCard key={c.id} client={c} commission={settings.commissionPercent} delay={i * 20} onEdit={() => setEditClient(c)} onMove={() => move(c.id, 'Купил')} moveLabel="→ Купил" onDragStart={() => setDragging(c.id)} />)}
            {!interested.length && <EmptyCol text="Нет заинтересованных" />}
          </KanbanCol>
          <KanbanCol title="Купил" count={buyers.length}
            summary={`Заработано: ${fmtMoney(buyers.reduce((s, c) => s + c.orderAmount * settings.commissionPercent / 100, 0))}`}
            colorClass="bg-emerald-50 dark:bg-emerald-900/10" titleClass="text-emerald-800 dark:text-emerald-400"
            badgeClass="bg-emerald-200/80 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400"
            isDragOver={dragOver === 'Купил'}
            onDrop={() => { if (dragging) move(dragging, 'Купил'); }}
            onDragOver={e => { e.preventDefault(); setDragOver('Купил'); }}
            onDragLeave={() => setDragOver(null)}>
            {buyers.map((c, i) => <KCard key={c.id} client={c} commission={settings.commissionPercent} delay={i * 20} onEdit={() => setEditClient(c)} onMove={() => move(c.id, 'Заинтересован')} moveLabel="← Назад" onDragStart={() => setDragging(c.id)} />)}
            {!buyers.length && <EmptyCol text="Нет купивших" />}
          </KanbanCol>
        </div>
      </div>

      {editClient && <ClientForm client={editClient} onClose={() => setEditClient(null)} />}
    </div>
  );
}

function KanbanCol({ title, count, summary, colorClass, titleClass, badgeClass, children, isDragOver, onDrop, onDragOver, onDragLeave }: {
  title: string; count: number; summary: string; colorClass: string; titleClass: string; badgeClass: string;
  children: React.ReactNode; isDragOver: boolean; onDrop: () => void; onDragOver: (e: React.DragEvent) => void; onDragLeave: () => void;
}) {
  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${isDragOver ? 'ring-2 ring-foreground/20 scale-[1.01]' : 'border-border bg-card'}`} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}>
      <div className={`px-3.5 py-2.5 border-b border-border ${colorClass}`}>
        <div className="flex items-center justify-between">
          <span className={`font-semibold text-sm ${titleClass}`}>{title}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>{count}</span>
        </div>
        <div className={`text-xs opacity-70 mt-0.5 ${titleClass}`}>{summary}</div>
      </div>
      <div className="p-2.5 space-y-2 min-h-[80px] max-h-96 overflow-y-auto">{children}</div>
    </div>
  );
}

function KCard({ client: c, commission, delay, onEdit, onMove, moveLabel, onDragStart }: {
  client: Client; commission: number; delay: number; onEdit: () => void; onMove: () => void; moveLabel: string; onDragStart: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const isToday = c.nextActionDate === today;
  const isOverdue = c.nextActionDate && c.nextActionDate < today;
  return (
    <div draggable onDragStart={onDragStart} className="bg-background border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-foreground/20 hover:shadow-sm transition-all duration-150 animate-item" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className="font-medium text-sm leading-tight">{c.name}</span>
        <button onClick={onEdit} className="text-muted-foreground hover:text-foreground p-0.5 shrink-0 rounded"><Icon name="Pencil" size={12} /></button>
      </div>
      <div className="text-xs text-muted-foreground mb-2">{c.product}</div>
      {c.comment && (
        <div className="text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 text-amber-800 dark:text-amber-300 rounded-lg px-2 py-1.5 mb-2 leading-snug">{c.comment}</div>
      )}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm font-semibold font-mono-ibm">{new Intl.NumberFormat('ru-RU').format(c.orderAmount)} ₽</div>
          <div className="text-[11px] text-muted-foreground">{new Intl.NumberFormat('ru-RU').format(Math.round(c.orderAmount * commission / 100))} ₽</div>
        </div>
        {c.nextActionDate && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : isToday ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-secondary text-muted-foreground'}`}>
            {new Date(c.nextActionDate + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
        {c.phone && <button onClick={() => navigator.clipboard.writeText(c.phone)} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Icon name="Phone" size={13} /></button>}
        {c.avitoLink && <a href={c.avitoLink} target="_blank" rel="noreferrer" className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Icon name="ExternalLink" size={13} /></a>}
        <button onClick={onMove} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-0.5 hover:bg-secondary transition-all">{moveLabel}</button>
      </div>
    </div>
  );
}

function EmptyCol({ text }: { text: string }) {
  return <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2"><Icon name="Inbox" size={18} className="opacity-30" />{text}</div>;
}
