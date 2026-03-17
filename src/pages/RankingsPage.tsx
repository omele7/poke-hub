import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RankingsFeature } from '@/features/rankings/RankingsFeature';

export function RankingsPage() {
  return (
    <AppShell>
      <div className="mb-5">
        <Link
          to="/"
          className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky/30"
        >
          Volver al inicio
        </Link>
      </div>
      <RankingsFeature />
    </AppShell>
  );
}
