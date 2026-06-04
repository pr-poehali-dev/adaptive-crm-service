import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store';
import Icon from '@/components/ui/icon';

export default function Settings() {
  const { dark, toggle } = useTheme();
  const { state } = useStore();
  const { clients, tasks } = state;

  const totalClients = clients.length;
  const buyers = clients.filter(c => c.status === 'Купил').length;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.done).length;

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground text-sm mt-1">Параметры системы</p>
      </div>

      <div className="space-y-3 animate-fade-in" style={{ animationDelay: '60ms' }}>

        {/* Тема */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Тема оформления</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {dark ? 'Тёмная тема активна' : 'Светлая тема активна'}
              </div>
            </div>
            <button
              onClick={toggle}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                dark ? 'bg-foreground' : 'bg-secondary border border-border'
              }`}
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center text-[10px] ${
                dark
                  ? 'left-8 bg-background text-foreground'
                  : 'left-1 bg-foreground text-background'
              }`}>
                {dark ? '🌙' : '☀️'}
              </span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">База данных</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatRow icon="Users" label="Клиентов всего" value={totalClients} />
            <StatRow icon="ShoppingBag" label="Совершили покупку" value={buyers} />
            <StatRow icon="CheckSquare" label="Задач всего" value={totalTasks} />
            <StatRow icon="CheckCircle2" label="Задач выполнено" value={doneTasks} />
          </div>
        </div>

        {/* Info */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-1">О системе</h2>
          <p className="text-xs text-muted-foreground mb-3">Данные хранятся в облачной базе данных. Доступны с любого устройства.</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Соединение с БД активно
          </div>
        </div>

        {/* Commission note */}
        <div className="bg-secondary/50 border border-border rounded-xl p-4">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Icon name="Info" size={13} className="mt-0.5 shrink-0" />
            <span>Комиссия зафиксирована на уровне <strong className="text-foreground">5%</strong> от суммы заказа.</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center shrink-0">
        <Icon name={icon} size={14} className="text-muted-foreground" />
      </div>
      <div>
        <div className="text-base font-semibold leading-tight">{value}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
