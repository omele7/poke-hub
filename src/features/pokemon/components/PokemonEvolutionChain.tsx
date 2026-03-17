import { Link } from 'react-router-dom';

type PokemonEvolutionItem = {
  name: string;
  sprite: string | null;
};

type PokemonEvolutionChainProps = {
  items: PokemonEvolutionItem[];
  currentPokemonName: string;
  loading?: boolean;
};

function EvolutionSkeleton() {
  return (
    <div className="flex items-center gap-3 overflow-x-auto py-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-24 min-w-28 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

export function PokemonEvolutionChain({
  items,
  currentPokemonName,
  loading = false,
}: PokemonEvolutionChainProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Cadena evolutiva
      </h2>

      {loading ? <EvolutionSkeleton /> : null}

      {!loading && items.length === 0 ? (
        <p className="text-sm text-slate-500">No se encontro informacion de evolucion.</p>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto py-2">
          {items.map((item, index) => {
            const isCurrent = item.name.toLowerCase() === currentPokemonName.toLowerCase();
            return (
              <div key={item.name} className="flex items-center gap-2">
                <Link
                  to={`/pokemon/${item.name}`}
                  className={`group flex min-w-28 flex-col items-center rounded-2xl border p-3 shadow-sm transition ${
                    isCurrent
                      ? 'border-sky bg-sky/10'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky/30'
                  }`}
                >
                  <img
                    src={item.sprite ?? ''}
                    alt={item.name}
                    className="h-14 w-14 object-contain transition group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="mt-1 text-xs font-semibold capitalize text-ink">
                    {item.name}
                  </span>
                </Link>
                {index < items.length - 1 ? <span className="text-slate-400">→</span> : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
