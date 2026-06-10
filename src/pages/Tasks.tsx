import { useState } from 'react';
import { useStore } from '@/store';
import Icon from '@/components/ui/icon';

export default function Tasks() {
  const { state, addTask, updateTask, deleteTask } = useStore();
  const { tasks, clients } = state;
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newClientId, setNewClientId] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'done'>('all');

  const today = new Date().toISOString().split('T')[0];

  const filtered = tasks.filter(t => {
    if (filter === 'today') return t.dueDate === today && !t.done;
    if (filter === 'done') return t.done;
    return true;
  }).sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTask({ title: newTitle.trim(), dueDate: newDate, done: false, clientId: newClientId || undefined });
    setNewTitle(''); setNewClientId('');
  };

  const getClientName = (id?: string) => id ? (clients.find(c => c.id === id)?.name ?? null) : null;
  const pending = tasks.filter(t => !t.done).length;
  const overdue = tasks.filter(t => !t.done && t.dueDate < today).length;

  if (state.loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-4 md:px-8 py-5 max-w-3xl mx-auto">
      <div className="mb-4 animate-fade-in">
        <h1 className="text-xl font-semibold tracking-tight">Задачи</h1>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground">{pending} активных</span>
          {overdue > 0 && <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">{overdue} просрочено</span>}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-3.5 mb-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <input type="text" placeholder="Новая задача..." value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all mb-2" />
        <div className="flex gap-2">
          <select value={newClientId} onChange={e => setNewClientId(e.target.value)}
            className="flex-1 min-w-0 bg-secondary rounded-xl px-3 py-2 text-sm outline-none text-muted-foreground">
            <option value="">— Клиент</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
            className="bg-secondary rounded-xl px-3 py-2 text-sm outline-none w-36 shrink-0" />
          <button onClick={handleAdd}
            className="bg-foreground text-background rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity shrink-0">
            +
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 animate-fade-in" style={{ animationDelay: '80ms' }}>
        {(['all', 'today', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filter === f ? 'bg-foreground text-background' : 'bg-card border border-border text-muted-foreground'
            }`}>
            {f === 'all' ? 'Все' : f === 'today' ? 'Сегодня' : 'Выполнено'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-14 text-muted-foreground">
            <Icon name="CheckCircle2" size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Задач нет</p>
          </div>
        )}
        {filtered.map((task, i) => {
          const isOverdue = !task.done && task.dueDate < today;
          const isToday = task.dueDate === today;
          const clientName = getClientName(task.clientId);
          return (
            <div key={task.id}
              className="bg-card border border-border rounded-xl p-3.5 flex items-start gap-3 animate-item transition-all"
              style={{ animationDelay: `${i * 25}ms`, opacity: task.done ? 0.45 : 1 }}>
              <button onClick={() => updateTask(task.id, { done: !task.done })}
                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                  task.done ? 'bg-foreground border-foreground' : 'border-border hover:border-foreground'
                }`}>
                {task.done && <Icon name="Check" size={11} className="text-background" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm leading-snug ${task.done ? 'line-through text-muted-foreground' : ''}`}>{task.title}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {clientName && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-medium">
                      {clientName}
                    </span>
                  )}
                  <span className={`text-xs ${isOverdue ? 'text-destructive font-medium' : isToday ? 'text-accent font-medium' : 'text-muted-foreground'}`}>
                    {isOverdue ? '⚠ ' : ''}{new Date(task.dueDate + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
              <button onClick={() => deleteTask(task.id)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0">
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
