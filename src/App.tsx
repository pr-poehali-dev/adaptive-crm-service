import { useEffect } from 'react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Tasks from "@/pages/Tasks";
import Clients from "@/pages/Clients";
import Kanban from "@/pages/Kanban";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import NotFound from "./pages/NotFound";
import { StoreContext, useCreateStore } from "@/store";

function ThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem('dacha_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  }, []);
  return null;
}

function AppProviders({ children }: { children: React.ReactNode }) {
  const store = useCreateStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

const App = () => (
  <TooltipProvider>
    <ThemeInit />
    <BrowserRouter>
      <AppProviders>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </AppProviders>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;