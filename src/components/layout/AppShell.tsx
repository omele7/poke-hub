import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useThemeMode } from '@/hooks/useThemeMode';

type AppShellProps = {
  children: ReactNode;
};

const NAV_ITEMS = [
  { to: '/', label: 'Inicio' },
  { to: '/favorites', label: 'Favoritos' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/compare', label: 'Comparar' },
  { to: '/team-builder', label: 'Team Builder' },
  { to: '/rankings', label: 'Rankings' },
];

export function AppShell({ children }: AppShellProps) {
  const { isDarkMode, toggleThemeMode } = useThemeMode();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen text-slate-900 transition-colors duration-300 dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl transition-colors dark:border-slate-700/70 dark:bg-slate-900/75">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="rounded-xl bg-sky/15 px-2 py-1 text-xs font-extrabold tracking-[0.2em] text-sky dark:bg-sky/25 dark:text-sky-200">
              POKEHUB
            </span>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'bg-sky text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleThemeMode}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-sky/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {isDarkMode ? 'Modo claro' : 'Modo oscuro'}
            </button>

            <button
              type="button"
              onClick={() => setMobileNavOpen((current) => !current)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              Menu
            </button>
          </div>
        </div>

        {mobileNavOpen ? (
          <nav className="border-t border-slate-200/80 px-4 pb-3 pt-2 md:hidden dark:border-slate-700/70">
            <div className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2 text-center text-sm font-semibold transition',
                      isActive
                        ? 'bg-sky text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <main className="animate-fade-in-up mx-auto w-full max-w-6xl px-4 pb-10 pt-6">
        {children}
      </main>
    </div>
  );
}
