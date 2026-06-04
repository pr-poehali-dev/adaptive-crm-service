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
    addTask({
      title: newTitle.trim(),
      dueDate: newDate,
      done: false,
      clientId: newClientId || undefined,
    });
    setNewTitle('');
    setNewClientId('');
  };

  const getClientName = (id?: string) => {
    if (!id) return null;
    return clients.find(c => c.id === id)?.name ?? null;
  };

  const pending = tasks.filter(t => !t.done).length;

  if (state.loading) return <Loading />;

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight">Задачи</h1>
        <p className="text-muted-foreground text-sm mt-1">{pending} активных задач</p>
      </div>

      {/* Add task */}
      <div className="bg-card border border-border rounded-xl p-4 mb-5 animate-fade-in" style={{ animationDelay: '60ms' }}>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Новая задача..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
          />
          <div className="flex gap-2">
            <select
              value={newClientId}
              onChange={e => setNewClientId(e.target.value)}
              className="flex-1 bg-secondary rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all text-muted-foreground"
            >
              <option value="">— Клиент (необязательно)</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="bg-secondary rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
            />
            <button
              onClick={handleAdd}
              className="bg-foreground text-background rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Добавить
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        {(['all', 'today', 'done'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              filter === f ? 'bg-foreground text-background' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'Все' : f === 'today' ? 'Сегодня' : 'Выполненные'}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm animate-fade-in">
            <Icon name="CheckCircle2" size={32} className="mx-auto mb-2 opacity-20" />
            Задач нет
          </div>
        )}
        {filtered.map((task, i) => {
          const isOverdue = !task.done && task.dueDate < today;
          const isToday = task.dueDate === today;
          const clientName = getClientName(task.clientId);
          return (
            <div
              key={task.id}
              className="animate-item"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className={`bg-card border rounded-xl p-3.5 flex items-start gap-3 transition-all duration-200 card-hover ${
                task.done ? 'opacity-40 border-border' : 'border-border'
              }`}>
                <button
                  onClick={() => updateTask(task.id, { ...task, done: !task.done })}
                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                    task.done ? 'bg-foreground border-foreground' : 'border-border hover:border-foreground'
                  }`}
                >
                  {task.done && <Icon name="Check" size={11} className="text-background" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {clientName && (
                      <span className="text-xs badge-blue px-1.5 py-0.5 rounded-md font-medium">{clientName}</span>
                    )}
                    <span className={`text-xs ${
                      isOverdue ? 'text-destructive font-medium' : isToday ? 'text-accent font-medium' : 'text-muted-foreground'
                    }`}>
                      {isOverdue ? '⚠ ' : ''}{new Date(task.dueDate + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
                >
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
    </div>
  );
}
