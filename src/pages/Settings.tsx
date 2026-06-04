import { useState } from 'react';
import { useStore } from '@/store';
import Icon from '@/components/ui/icon';

export default function Settings() {
  const { state, updateSettings } = useStore();
  const { settings } = state;
  const [commission, setCommission] = useState(String(settings.commissionPercent));
  const [userName, setUserName] = useState(settings.userName);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings({
      commissionPercent: parseFloat(commission) || 5,
      userName,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const { clients } = state;
  const totalClients = clients.length;
  const buyers = clients.filter(c => c.status === 'Купил').length;
  const storageSize = (JSON.stringify(state).length / 1024).toFixed(1);

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground text-sm mt-1">Параметры вашего CRM</p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Профиль</h2>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Ваше имя</label>
            <input
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="Имя менеджера"
              className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
            />
          </div>
        </div>

        {/* Commission */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-1">Комиссия</h2>
          <p className="text-xs text-muted-foreground mb-4">Процент от суммы заказа, который идёт вам как прибыль</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={commission}
              onChange={e => setCommission(e.target.value)}
              min="0"
              max="100"
              step="0.5"
              className="w-32 bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all font-mono-ibm"
            />
            <span className="text-sm text-muted-foreground">% от суммы заказа</span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
            Например: при заказе на 100 000 ₽ ваша прибыль составит{' '}
            <span className="font-medium text-foreground">
              {new Intl.NumberFormat('ru-RU').format(Math.round(100000 * (parseFloat(commission) || 0) / 100))} ₽
            </span>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`w-full rounded-xl py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            saved ? 'bg-secondary text-foreground' : 'bg-foreground text-background hover:opacity-90'
          }`}
        >
          {saved ? (
            <>
              <Icon name="Check" size={16} />
              Сохранено!
            </>
          ) : 'Сохранить настройки'}
        </button>

        {/* Stats */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Статистика базы</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-semibold">{totalClients}</div>
              <div className="text-xs text-muted-foreground">Клиентов</div>
            </div>
            <div>
              <div className="text-xl font-semibold">{buyers}</div>
              <div className="text-xs text-muted-foreground">Купили</div>
            </div>
            <div>
              <div className="text-xl font-semibold">{storageSize} KB</div>
              <div className="text-xs text-muted-foreground">Данных</div>
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-1">Данные</h2>
          <p className="text-xs text-muted-foreground mb-4">Все данные хранятся локально в браузере</p>
          <button
            onClick={() => {
              if (confirm('Вы уверены? Все данные будут удалены без возможности восстановления.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="text-xs text-destructive hover:underline flex items-center gap-1.5"
          >
            <Icon name="Trash2" size={13} />
            Очистить все данные
          </button>
        </div>
      </div>
    </div>
  );
}
