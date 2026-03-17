import { memo } from 'react';
import type { Pokemon } from '@/types/pokemon';
import { getPokemonArtwork, getTypeBadgeClass } from '@/features/pokemon/utils/pokemonUi';
import { useFavoritesStore } from '@/store/favoritesStore';

type PokemonCardProps = {
  pokemon: Pokemon;
  onSelect: (pokemon: Pokemon) => void;
};

export const PokemonCard = memo(function PokemonCard({ pokemon, onSelect }: PokemonCardProps) {
  const artwork = getPokemonArtwork(pokemon);
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
    <article className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-sky/30 hover:shadow-lg">
      <button
        type="button"
        className={`absolute right-3 top-3 z-10 rounded-full border px-2 py-1 text-xs font-bold transition ${
          isFavorite
            ? 'border-amber-300 bg-amber-100 text-amber-700'
            : 'border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-700'
        }`}
        onClick={toggleFavorite}
        aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        {isFavorite ? '★' : '☆'}
      </button>

      <button
        type="button"
        onClick={() => onSelect(pokemon)}
        className="flex h-full flex-col text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-sky/20"
      >
        <p className="text-xs font-semibold tracking-wide text-slate-400">
          #{pokemon.id.toString().padStart(3, '0')}
        </p>
        <img
          src={artwork}
          alt={pokemon.name}
          className="mx-auto h-28 w-28 object-contain transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <h3 className="mt-3 text-base font-bold capitalize text-ink">{pokemon.name}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {pokemon.types.map((slot) => (
            <span
              key={slot.type.name}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getTypeBadgeClass(slot.type.name)}`}
            >
              {slot.type.name}
            </span>
          ))}
        </div>
      </button>
    </article>
  );
});

PokemonCard.displayName = 'PokemonCard';
