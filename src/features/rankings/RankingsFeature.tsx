import { Link } from 'react-router-dom';
import { getPokemonArtwork } from '@/features/pokemon/utils/pokemonUi';
import { usePokemonRankings } from '@/features/rankings/hooks/usePokemonRankings';

function formatMeasure(value: number, key: string): number {
  if (key === 'height' || key === 'weight') {
    return Number((value / 10).toFixed(1));
  }

  return value;
}

export function RankingsFeature() {
  const { rankings, loading, error, warning, reloadRankings } = usePokemonRankings();

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-amber/20" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-sky/15" />

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Rankings
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">Pokemon Rankings</h1>
            <p className="mt-2 text-sm text-slate-600">
              Top 10 Pokemon por HP, ataque, defensa, ataque especial, defensa especial, velocidad,
              altura y peso.
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky/30"
            onClick={reloadRankings}
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar ranking'}
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {warning ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          {warning}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="skeleton-shimmer h-72 rounded-3xl dark:border dark:border-slate-700"
            />
          ))}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="grid gap-4 md:grid-cols-2">
          {rankings.map(({ category, items }) => (
            <section
              key={category.key}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-bold text-ink">{category.title}</h2>

              <ol className="mt-4 space-y-2">
                {items.map((entry, index) => (
                  <li
                    key={`${category.key}-${entry.pokemon.id}`}
                    className="grid grid-cols-[24px_40px_1fr_auto] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <span className="text-xs font-bold text-slate-500">#{index + 1}</span>
                    <img
                      src={getPokemonArtwork(entry.pokemon)}
                      alt={entry.pokemon.name}
                      className="h-10 w-10 object-contain"
                      loading="lazy"
                    />
                    <Link
                      to={`/pokemon/${entry.pokemon.name}`}
                      className="truncate text-sm font-semibold capitalize text-ink hover:text-sky"
                    >
                      {entry.pokemon.name}
                    </Link>
                    <span className="text-xs font-bold text-slate-600">
                      {category.valueLabel} {formatMeasure(entry.value, category.key)}
                      {category.unit}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}
