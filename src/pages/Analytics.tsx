import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

type Period = 'week' | 'month' | 'all';

function fmtMoney(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + ' млн ₽';
  if (n >= 1000) return Math.round(n / 1000) + ' тыс ₽';
  return n + ' ₽';
}

const PIE_COLORS = ['#16a34a', '#d97706', '#2563eb', '#dc2626', '#7c3aed'];

export default function Analytics() {
  const { state } = useStore();
  const { clients, settings } = state;
  const [period, setPeriod] = useState<Period>('month');

  const dateRange = useMemo(() => {
    const now = new Date();
    if (period === 'week') {
      const from = new Date(now); from.setDate(now.getDate() - 6);
      return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    if (period === 'month') {
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
      };
    }
    return { from: '', to: '' }; // all
  }, [period]);

  const periodClients = useMemo(() => {
    if (!dateRange.from) return clients;
    return clients.filter(c => {
      const d = (c.createdAt ?? '').split('T')[0];
      return d >= dateRange.from && d <= dateRange.to;
    });
  }, [clients, dateRange]);

  const buyers = useMemo(() => periodClients.filter(c => c.status === 'Купил'), [periodClients]);
  const interested = useMemo(() => periodClients.filter(c => c.status === 'Заинтересован'), [periodClients]);

  const turnover = useMemo(() => buyers.reduce((s, c) => s + c.orderAmount, 0), [buyers]);
  const earned = useMemo(() => turnover * (settings.commissionPercent / 100), [turnover, settings]);
  const potential = useMemo(() => interested.reduce((s, c) => s + c.orderAmount * (settings.commissionPercent / 100), 0), [interested, settings]);
  const conversion = periodClients.length > 0 ? Math.round(buyers.length / periodClients.length * 100) : 0;
  const avgCheck = buyers.length > 0 ? Math.round(turnover / buyers.length) : 0;

  // Bar chart — продажи по дням
  const barData = useMemo(() => {
    const map: Record<string, { label: string; turnover: number; profit: number }> = {};
    buyers.forEach(c => {
      const d = (c.createdAt ?? '').split('T')[0];
      if (!d) return;
      if (!map[d]) map[d] = {
        label: new Date(d + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        turnover: 0, profit: 0,
      };
      map[d].turnover += c.orderAmount;
      map[d].profit += c.orderAmount * settings.commissionPercent / 100;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [buyers, settings]);

  // Pie — типы изделий
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    periodClients.forEach(c => { map[c.productType] = (map[c.productType] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [periodClients]);

  // Line — новые клиенты по дням
  const lineData = useMemo(() => {
    const map: Record<string, number> = {};
    periodClients.forEach(c => {
      const d = (c.createdAt ?? '').split('T')[0];
      if (d) map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([d, count]) => ({
      label: new Date(d + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      count,
    }));
  }, [periodClients]);

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'week', label: 'Неделя' },
    { key: 'month', label: 'Месяц' },
    { key: 'all', label: 'Всё время' },
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
        <p className="text-muted-foreground text-sm mt-1">{periodClients.length} клиентов за период</p>
      </div>

      {/* Period */}
      <div className="flex gap-2 mb-6 animate-fade-in" style={{ animationDelay: '60ms' }}>
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              period === p.key ? 'bg-foreground text-background' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <StatCard label="Оборот" value={fmtMoney(turnover)} />
        <StatCard label="Заработано" value={fmtMoney(earned)} dark />
        <StatCard label="Потенциал" value={fmtMoney(potential)} />
        <StatCard label="Конверсия" value={`${conversion}%`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-fade-in" style={{ animationDelay: '140ms' }}>
        <StatCard label="Клиентов" value={String(periodClients.length)} />
        <StatCard label="Купили" value={String(buyers.length)} />
        <StatCard label="Заинтересованы" value={String(interested.length)} />
        <StatCard label="Средний чек" value={avgCheck > 0 ? fmtMoney(avgCheck) : '—'} />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Bar: оборот */}
        <div className="bg-card border border-border rounded-xl p-4 animate-fade-in" style={{ animationDelay: '160ms' }}>
          <div className="text-sm font-medium mb-1">Продажи по дням</div>
          <div className="text-xs text-muted-foreground mb-4">Оборот и прибыль купивших</div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barGap={2}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? Math.round(v/1000)+'к' : String(v)} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(val: number, name: string) => [fmtMoney(val), name === 'turnover' ? 'Оборот' : 'Прибыль']}
                />
                <Bar dataKey="turnover" fill="hsl(var(--secondary))" radius={[4,4,0,0]} />
                <Bar dataKey="profit" fill="hsl(var(--foreground))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </div>

        {/* Pie: типы */}
        <div className="bg-card border border-border rounded-xl p-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="text-sm font-medium mb-1">Типы изделий</div>
          <div className="text-xs text-muted-foreground mb-4">Распределение по категориям</div>
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
                    <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
                    <span className="font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <Empty />}
        </div>

        {/* Line: новые клиенты */}
        <div className="bg-card border border-border rounded-xl p-4 md:col-span-2 animate-fade-in" style={{ animationDelay: '240ms' }}>
          <div className="text-sm font-medium mb-1">Новые клиенты</div>
          <div className="text-xs text-muted-foreground mb-4">Количество добавленных клиентов по дням</div>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={lineData}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--foreground))" strokeWidth={2}
                  dot={{ r: 4, fill: 'hsl(var(--foreground))', strokeWidth: 0 }}
                  activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
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
