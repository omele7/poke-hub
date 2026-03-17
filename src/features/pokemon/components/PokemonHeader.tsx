import type { Pokemon } from '@/types/pokemon';
import {
  formatHeight,
  formatWeight,
  getPokemonArtwork,
  getTypeBadgeClass,
} from '@/features/pokemon/utils/pokemonUi';
import { useFavoritesStore } from '@/store/favoritesStore';

type PokemonHeaderProps = {
  pokemon: Pokemon;
};

export function PokemonHeader({ pokemon }: PokemonHeaderProps) {
  const isFavorite = useFavoritesStore((state) => state.isFavorite(pokemon.id));
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);

  function toggleFavorite() {
    if (isFavorite) {
      removeFavorite(pokemon.id);
      return;
    }

    addFavorite(pokemon);
  }

  return (
    <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-sky/10" />
      <div className="absolute -bottom-20 -left-14 h-48 w-48 rounded-full bg-amber/10" />

      <button
        type="button"
        className={`absolute right-4 top-4 z-10 rounded-full border px-2.5 py-1 text-sm font-bold transition ${
          isFavorite
            ? 'border-amber-300 bg-amber-100 text-amber-700'
            : 'border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-700'
        }`}
        onClick={toggleFavorite}
        aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        {isFavorite ? '★' : '☆'}
      </button>

      <div className="relative grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
        <img
          src={getPokemonArtwork(pokemon)}
          alt={pokemon.name}
          className="mx-auto h-44 w-44 object-contain drop-shadow"
        />

        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-400">
            #{pokemon.id.toString().padStart(3, '0')}
          </p>
          <h1 className="mt-1 text-4xl font-bold capitalize tracking-tight text-ink">
            {pokemon.name}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2">
            {pokemon.types.map((slot) => (
              <span
                key={slot.type.name}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getTypeBadgeClass(slot.type.name)}`}
              >
                {slot.type.name}
              </span>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Altura</p>
              <p className="mt-1 text-lg font-bold text-ink">{formatHeight(pokemon.height)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Peso</p>
              <p className="mt-1 text-lg font-bold text-ink">{formatWeight(pokemon.weight)}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
