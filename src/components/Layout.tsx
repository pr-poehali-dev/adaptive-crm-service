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
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center shrink-0">
              <span className="text-background text-sm font-bold">Д</span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">ДачаПро</div>
              <div className="text-[10px] text-muted-foreground">CRM система</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(item => {
            const active = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  active
                    ? 'bg-foreground text-background font-medium shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-border">
          <div className="text-[10px] text-muted-foreground/60">v2.0 · ДачаПро CRM</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border z-50 flex safe-area-pb">
        {navItems.map(item => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all duration-150 ${
                active ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all duration-150 ${active ? 'bg-foreground text-background' : ''}`}>
                <Icon name={item.icon} size={18} />
              </div>
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
