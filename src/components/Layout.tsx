import { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Главная', icon: 'LayoutDashboard' },
  { path: '/tasks', label: 'Задачи', icon: 'CheckSquare' },
  { path: '/clients', label: 'Клиенты', icon: 'Users' },
  { path: '/kanban', label: 'Канбан', icon: 'Kanban' },
  { path: '/analytics', label: 'Аналитика', icon: 'BarChart3' },
  { path: '/settings', label: 'Настройки', icon: 'Settings' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-card border-r border-border fixed top-0 left-0 z-40">
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-foreground rounded-md flex items-center justify-center">
              <span className="text-background text-xs font-semibold">Д</span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">ДачаПро</div>
              <div className="text-[10px] text-muted-foreground">CRM система</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(item => {
            const active = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  active
                    ? 'bg-foreground text-background font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-border">
          <div className="text-[10px] text-muted-foreground">v1.0 · ДачаПро CRM</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 flex">
        {navItems.map(item => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                active ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
