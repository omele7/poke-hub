import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';

export function NotFoundPage() {
  return (
    <AppShell>
      <div className="rounded-2xl bg-white/80 p-8 text-center shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">404</h1>
        <p className="mb-4 text-slate-600">Pagina no encontrada.</p>
        <Link className="font-semibold text-sky hover:underline" to="/">
          Volver al inicio
        </Link>
      </div>
    </AppShell>
  );
}
