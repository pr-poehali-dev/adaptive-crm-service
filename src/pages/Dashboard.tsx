import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store';
import Icon from '@/components/ui/icon';

function fmt(n: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard() {
  const { state } = useStore();
  const { clients, tasks, settings } = state;
  const today = new Date().toISOString().split('T')[0];

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

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Главная</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Оборот" value={fmt(metrics.turnover)} icon="TrendingUp" />
        <MetricCard label="Заработано" value={fmt(metrics.earned)} icon="Wallet" accent />
        <MetricCard label="Потенциал" value={fmt(metrics.potential)} icon="Target" />
        <MetricCard label="Конверсия" value={`${metrics.conversion}%`} icon="Percent" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-semibold">{metrics.interested}</div>
          <div className="text-xs text-muted-foreground mt-1">Заинтересованных</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-semibold">{metrics.buyers}</div>
          <div className="text-xs text-muted-foreground mt-1">Купили</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 col-span-2 md:col-span-1">
          <div className="text-2xl font-semibold">{clients.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Всего клиентов</div>
        </div>
      </div>

      {/* Today's actions */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Tasks today */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="CheckSquare" size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Задачи на сегодня</span>
            </div>
            <Link to="/tasks" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              все →
            </Link>
          </div>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Задач нет — можно выдохнуть 👍</p>
          ) : (
            <div className="space-y-2">
              {todayTasks.slice(0, 4).map(task => (
                <div key={task.id} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 shrink-0" />
                  <span>{task.title}</span>
                </div>
              ))}
              {todayTasks.length > 4 && (
                <div className="text-xs text-muted-foreground">+{todayTasks.length - 4} ещё</div>
              )}
            </div>
          )}
        </div>

        {/* Contacts today */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="MessageCircle" size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Написать сегодня</span>
            </div>
            <Link to="/clients" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              все →
            </Link>
          </div>
          {todayContacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Нет запланированных контактов</p>
          ) : (
            <div className="space-y-2">
              {todayContacts.map(c => (
                <div key={c.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.product}</div>
                  </div>
                  <div className="flex gap-2">
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary hover:bg-foreground hover:text-background transition-all"
                      >
                        <Icon name="Phone" size={13} />
                      </a>
                    )}
                    {c.avitoLink && (
                      <a
                        href={c.avitoLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary hover:bg-foreground hover:text-background transition-all"
                      >
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
  );
}

function MetricCard({ label, value, icon, accent }: { label: string; value: string; icon: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${accent ? 'bg-foreground text-background border-foreground' : 'bg-card border-border'}`}>
      <div className={`mb-2 ${accent ? 'text-background/60' : 'text-muted-foreground'}`}>
        <Icon name={icon} size={16} />
      </div>
      <div className="text-xl font-semibold leading-tight">{value}</div>
      <div className={`text-xs mt-1 ${accent ? 'text-background/70' : 'text-muted-foreground'}`}>{label}</div>
    </div>
  );
}
