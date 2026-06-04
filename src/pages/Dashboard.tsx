import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store';
import Icon from '@/components/ui/icon';

function fmt(n: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
}

function useMskCountdown() {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0, pct: 0 });
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      // MSK = UTC+3
      const mskOffset = 3 * 60;
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const msk = new Date(utcMs + mskOffset * 60000);
      const endOfDay = new Date(msk);
      endOfDay.setHours(23, 59, 59, 999);
      const remainMs = endOfDay.getTime() - msk.getTime();
      const totalMs = 24 * 3600 * 1000;
      const elapsed = totalMs - remainMs;
      const pct = Math.round((elapsed / totalMs) * 100);
      const h = Math.floor(remainMs / 3600000);
      const m = Math.floor((remainMs % 3600000) / 60000);
      const s = Math.floor((remainMs % 60000) / 1000);
      setTime({ hours: h, minutes: m, seconds: s, pct });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function Dashboard() {
  const { state } = useStore();
  const { clients, tasks, settings } = state;
  const today = new Date().toISOString().split('T')[0];
  const countdown = useMskCountdown();

  const metrics = useMemo(() => {
    const buyers = clients.filter(c => c.status === 'Купил');
    const interested = clients.filter(c => c.status === 'Заинтересован');
    const turnover = buyers.reduce((s, c) => s + c.orderAmount, 0);
    const earned = turnover * (settings.commissionPercent / 100);
    const potential = interested.reduce((s, c) => s + c.orderAmount * (settings.commissionPercent / 100), 0);
    const conversion = clients.length > 0 ? Math.round((buyers.length / clients.length) * 100) : 0;
    return { turnover, earned, potential, interested: interested.length, buyers: buyers.length, conversion };
  }, [clients, settings]);

  const todayTasks = tasks.filter(t => t.dueDate === today && !t.done);
  const todayContacts = clients.filter(c => c.nextActionDate === today);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (state.loading) return <LoadingScreen />;

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight">Главная</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Countdown до конца дня МСК */}
      <div className="mb-6 animate-fade-in" style={{ animationDelay: '60ms' }}>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Icon name="Timer" size={15} className="text-muted-foreground" />
              До конца дня (МСК)
            </div>
            <div className="font-mono-ibm text-xl font-semibold tabular-nums tracking-tight">
              {pad(countdown.hours)}:{pad(countdown.minutes)}
              <span className="text-muted-foreground text-base">:{pad(countdown.seconds)}</span>
            </div>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${countdown.pct}%`,
                background: countdown.pct > 85
                  ? 'hsl(var(--destructive))'
                  : countdown.pct > 60
                  ? 'hsl(var(--accent-amber))'
                  : 'hsl(var(--foreground))',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
            <span>0:00</span>
            <span>{countdown.pct}% дня прошло</span>
            <span>23:59</span>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Оборот', value: fmt(metrics.turnover), icon: 'TrendingUp', delay: 80 },
          { label: 'Заработано', value: fmt(metrics.earned), icon: 'Wallet', accent: true, delay: 120 },
          { label: 'Потенциал', value: fmt(metrics.potential), icon: 'Target', delay: 160 },
          { label: 'Конверсия', value: `${metrics.conversion}%`, icon: 'Percent', delay: 200 },
        ].map(m => (
          <div
            key={m.label}
            className="animate-fade-in"
            style={{ animationDelay: `${m.delay}ms` }}
          >
            <MetricCard label={m.label} value={m.value} icon={m.icon} accent={m.accent} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Заинтересованных', value: metrics.interested, color: 'badge-amber', delay: 220 },
          { label: 'Купили', value: metrics.buyers, color: 'badge-green', delay: 260 },
          { label: 'Всего клиентов', value: clients.length, color: '', delay: 300 },
        ].map(m => (
          <div key={m.label} className="animate-fade-in" style={{ animationDelay: `${m.delay}ms` }}>
            <div className="bg-card border border-border rounded-xl p-4 card-hover">
              <div className={`text-2xl font-semibold ${m.color ? '' : ''}`}>{m.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Today */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="animate-fade-in" style={{ animationDelay: '320ms' }}>
          <div className="bg-card border border-border rounded-xl p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="CheckSquare" size={15} className="text-muted-foreground" />
                <span className="text-sm font-medium">Задачи на сегодня</span>
                {todayTasks.length > 0 && (
                  <span className="text-xs bg-foreground text-background px-1.5 py-0.5 rounded-full font-medium">
                    {todayTasks.length}
                  </span>
                )}
              </div>
              <Link to="/tasks" className="text-xs text-muted-foreground hover:text-foreground transition-colors">все →</Link>
            </div>
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3">Задач нет 👌</p>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map((task, i) => (
                  <div key={task.id} className="flex items-start gap-2 text-sm animate-item" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    <span>{task.title}</span>
                  </div>
                ))}
                {todayTasks.length > 5 && (
                  <div className="text-xs text-muted-foreground">+{todayTasks.length - 5} ещё</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '360ms' }}>
          <div className="bg-card border border-border rounded-xl p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="MessageCircle" size={15} className="text-muted-foreground" />
                <span className="text-sm font-medium">Написать сегодня</span>
                {todayContacts.length > 0 && (
                  <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-medium animate-ring">
                    {todayContacts.length}
                  </span>
                )}
              </div>
              <Link to="/clients" className="text-xs text-muted-foreground hover:text-foreground transition-colors">все →</Link>
            </div>
            {todayContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3">Нет запланированных контактов</p>
            ) : (
              <div className="space-y-2.5">
                {todayContacts.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between animate-item" style={{ animationDelay: `${i * 40}ms` }}>
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.product}</div>
                    </div>
                    <div className="flex gap-1.5">
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary hover:bg-foreground hover:text-background transition-all duration-150">
                          <Icon name="Phone" size={13} />
                        </a>
                      )}
                      {c.avitoLink && (
                        <a href={c.avitoLink} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary hover:bg-foreground hover:text-background transition-all duration-150">
                          <Icon name="ExternalLink" size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, accent }: { label: string; value: string; icon: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border card-hover ${accent ? 'bg-foreground text-background border-foreground' : 'bg-card border-border'}`}>
      <div className={`mb-2 ${accent ? 'opacity-60' : 'text-muted-foreground'}`}>
        <Icon name={icon} size={15} />
      </div>
      <div className="text-xl font-semibold leading-tight">{value}</div>
      <div className={`text-xs mt-1 ${accent ? 'opacity-70' : 'text-muted-foreground'}`}>{label}</div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
        <span className="text-sm">Загрузка данных…</span>
      </div>
    </div>
  );
}
