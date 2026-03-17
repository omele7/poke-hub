import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useFavoritesStore } from '@/store/favoritesStore';
import { getTypeBadgeClass } from '@/features/pokemon/utils/pokemonUi';

export function FavoritesPage() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const getFavorites = useFavoritesStore((state) => state.getFavorites);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);

  const favoriteList = getFavorites();

  return (
    <AppShell>
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pokedex</p>
            <h1 className="text-3xl font-bold tracking-tight text-ink">Favoritos</h1>
            <p className="mt-1 text-sm text-slate-600">
              Tienes {favorites.length} Pokemon guardados.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky/30"
          >
            Volver a inicio
          </Link>
        </div>

        {favoriteList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-500">
            No tienes Pokemon favoritos todavia.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteList.map((pokemon) => (
              <article
                key={pokemon.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold tracking-wide text-slate-400">
                    #{pokemon.id.toString().padStart(3, '0')}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFavorite(pokemon.id)}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Quitar
                  </button>
                </div>

                <img
                  src={pokemon.sprite ?? ''}
                  alt={pokemon.name}
                  className="mx-auto mt-2 h-24 w-24 object-contain"
                />

                <h2 className="mt-2 text-center text-lg font-bold capitalize text-ink">
                  {pokemon.name}
                </h2>

                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {pokemon.types.map((slot) => (
                    <span
                      key={slot.type.name}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getTypeBadgeClass(slot.type.name)}`}
                    >
                      {slot.type.name}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex justify-center">
                  <Link
                    to={`/pokemon/${pokemon.name}`}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky/30"
                  >
                    Ver detalle
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
