import { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface NavItem { path: string; label: string; icon: string; }

const navItems: NavItem[] = [
  { path: '/', label: 'Главная', icon: 'LayoutDashboard' },
  { path: '/tasks', label: 'Задачи', icon: 'CheckSquare' },
  { path: '/clients', label: 'Клиенты', icon: 'Users' },
  { path: '/analytics', label: 'Аналитика', icon: 'BarChart3' },
  { path: '/settings', label: 'Настройки', icon: 'Settings' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-card border-r border-border fixed top-0 left-0 z-40">
        <div className="px-5 py-5 border-b border-border shrink-0">
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
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  active ? 'bg-foreground text-background font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}>
                <Icon name={item.icon} size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-border shrink-0">
          <div className="text-[10px] text-muted-foreground/50">ДачаПро CRM</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pb-[72px] md:pb-6 min-h-screen overflow-x-hidden">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="flex" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {navItems.map(item => {
            const active = pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5">
                <div className={`w-10 h-7 flex items-center justify-center rounded-xl transition-all duration-150 ${
                  active ? 'bg-foreground' : ''
                }`}>
                  <Icon name={item.icon} size={18}
                    className={active ? 'text-background' : 'text-muted-foreground'} />
                </div>
                <span className={`text-[10px] font-medium leading-none ${
                  active ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
