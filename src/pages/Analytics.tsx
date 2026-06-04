import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

type Period = 'week' | 'month' | 'last_month' | 'custom';

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + ' млн ₽';
  if (n >= 1000) return (n / 1000).toFixed(0) + ' тыс ₽';
  return n + ' ₽';
}

const PIE_COLORS = ['#16a34a', '#d97706', '#2563eb', '#dc2626', '#7c3aed'];

export default function Analytics() {
  const { state } = useStore();
  const { clients, settings } = state;
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const dateRange = useMemo(() => {
    const now = new Date();
    if (period === 'week') {
      const from = new Date(now); from.setDate(now.getDate() - 6);
      return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    if (period === 'month') {
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    if (period === 'last_month') {
      const fm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fm.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
    }
    return { from: customFrom, to: customTo };
  }, [period, customFrom, customTo]);

  const periodClients = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return clients;
    return clients.filter(c => {
      const d = c.createdAt.split('T')[0];
      return d >= dateRange.from && d <= dateRange.to;
    });
  }, [clients, dateRange]);

  const buyers = periodClients.filter(c => c.status === 'Купил');
  const interested = periodClients.filter(c => c.status === 'Заинтересован');
  const turnover = buyers.reduce((s, c) => s + c.orderAmount, 0);
  const earned = turnover * (settings.commissionPercent / 100);
  const potential = interested.reduce((s, c) => s + c.orderAmount * (settings.commissionPercent / 100), 0);
  const conversion = periodClients.length > 0 ? Math.round(buyers.length / periodClients.length * 100) : 0;

  const barData = useMemo(() => {
    const map: Record<string, { label: string; turnover: number; profit: number }> = {};
    buyers.forEach(c => {
      const d = c.updatedAt?.split('T')[0] ?? c.createdAt.split('T')[0];
      if (!map[d]) map[d] = { label: new Date(d + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }), turnover: 0, profit: 0 };
      map[d].turnover += c.orderAmount;
      map[d].profit += c.orderAmount * settings.commissionPercent / 100;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [buyers, settings]);

  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    periodClients.forEach(c => { map[c.productType] = (map[c.productType] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [periodClients]);

  const lineData = useMemo(() => {
    const map: Record<string, number> = {};
    periodClients.forEach(c => {
      const d = c.createdAt.split('T')[0];
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([d, count]) => ({
      label: new Date(d + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      count,
    }));
  }, [periodClients]);

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'week', label: 'Неделя' },
    { key: 'month', label: 'Этот месяц' },
    { key: 'last_month', label: 'Прошлый месяц' },
    { key: 'custom', label: 'Период' },
  ];

  if (state.loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight">Аналитика</h1>
        <p className="text-muted-foreground text-sm mt-1">Статистика по периоду</p>
      </div>

      {/* Period */}
      <div className="flex flex-wrap gap-2 mb-6 animate-fade-in" style={{ animationDelay: '60ms' }}>
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              period === p.key ? 'bg-foreground text-background' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}>
            {p.label}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex gap-2 items-center">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-foreground/20" />
            <span className="text-muted-foreground text-xs">—</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-foreground/20" />
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <Stat label="Оборот" value={fmt(turnover)} />
        <Stat label="Заработано" value={fmt(earned)} dark />
        <Stat label="Потенциал" value={fmt(potential)} />
        <Stat label="Конверсия" value={`${conversion}%`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-fade-in" style={{ animationDelay: '140ms' }}>
        <Stat label="Всего клиентов" value={String(periodClients.length)} />
        <Stat label="Купили" value={String(buyers.length)} />
        <Stat label="Заинтересованы" value={String(interested.length)} />
        <Stat label="Ср. чек" value={buyers.length > 0 ? fmt(Math.round(turnover / buyers.length)) : '—'} />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 animate-fade-in" style={{ animationDelay: '160ms' }}>
          <div className="text-sm font-medium mb-4">Оборот и прибыль</div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barGap={2}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? v / 1000 + 'к' : String(v)} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))' }}
                  formatter={(val: number, name: string) => [fmt(val), name === 'turnover' ? 'Оборот' : 'Прибыль']} />
                <Bar dataKey="turnover" fill="hsl(var(--border))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="text-sm font-medium mb-4">Типы изделий</div>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-muted-foreground flex-1">{d.name}</span>
                    <span className="font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <Empty />}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 md:col-span-2 animate-fade-in" style={{ animationDelay: '240ms' }}>
          <div className="text-sm font-medium mb-4">Новые клиенты</div>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={lineData}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))' }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--foreground))' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border card-hover ${dark ? 'bg-foreground text-background border-foreground' : 'bg-card border-border'}`}>
      <div className="text-lg font-semibold leading-tight">{value}</div>
      <div className={`text-xs mt-1 ${dark ? 'opacity-70' : 'text-muted-foreground'}`}>{label}</div>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
      Нет данных за период
    </div>
  );
}
