import type { Pokemon } from '@/types/pokemon';
import { PokemonCard } from '@/features/pokemon/components/PokemonCard';

type PokemonGridProps = {
  pokemons: Pokemon[];
  loading: boolean;
  loadingMore: boolean;
  onSelect: (pokemon: Pokemon) => void;
  emptyMessage: string;
};

function PokemonCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="skeleton-shimmer h-3 w-16 rounded" />
      <div className="skeleton-shimmer mx-auto mt-4 h-28 w-28 rounded-full" />
      <div className="skeleton-shimmer mt-4 h-4 w-24 rounded" />
      <div className="mt-3 flex gap-2">
        <div className="skeleton-shimmer h-6 w-16 rounded-full" />
        <div className="skeleton-shimmer h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function PokemonGrid({
  pokemons,
  loading,
  loadingMore,
  onSelect,
  emptyMessage,
}: PokemonGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <PokemonCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (pokemons.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {pokemons.map((pokemon) => (
        <PokemonCard key={pokemon.id} pokemon={pokemon} onSelect={onSelect} />
      ))}
      {loadingMore
        ? Array.from({ length: 4 }).map((_, index) => (
            <PokemonCardSkeleton key={`loading-more-${index}`} />
          ))
        : null}
    </div>
  );
}
