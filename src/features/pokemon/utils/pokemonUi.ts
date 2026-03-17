import type { Pokemon } from '@/types/pokemon';

const typeColorMap: Record<string, string> = {
  normal:
    'border border-stone-300 bg-stone-200 text-stone-700 dark:border-stone-500/40 dark:bg-stone-400/25 dark:text-stone-100',
  fire: 'border border-orange-300 bg-orange-200 text-orange-700 dark:border-orange-400/40 dark:bg-orange-500/25 dark:text-orange-100',
  water:
    'border border-blue-300 bg-blue-200 text-blue-700 dark:border-blue-400/40 dark:bg-blue-500/25 dark:text-blue-100',
  electric:
    'border border-yellow-300 bg-yellow-200 text-yellow-700 dark:border-yellow-400/40 dark:bg-yellow-500/25 dark:text-yellow-100',
  grass:
    'border border-emerald-300 bg-emerald-200 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/25 dark:text-emerald-100',
  ice: 'border border-cyan-300 bg-cyan-200 text-cyan-700 dark:border-cyan-400/40 dark:bg-cyan-500/25 dark:text-cyan-100',
  fighting:
    'border border-red-300 bg-red-200 text-red-700 dark:border-red-400/40 dark:bg-red-500/25 dark:text-red-100',
  poison:
    'border border-fuchsia-300 bg-fuchsia-200 text-fuchsia-700 dark:border-fuchsia-400/40 dark:bg-fuchsia-500/25 dark:text-fuchsia-100',
  ground:
    'border border-amber-300 bg-amber-200 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/25 dark:text-amber-100',
  flying:
    'border border-indigo-300 bg-indigo-200 text-indigo-700 dark:border-indigo-400/40 dark:bg-indigo-500/25 dark:text-indigo-100',
  psychic:
    'border border-pink-300 bg-pink-200 text-pink-700 dark:border-pink-400/40 dark:bg-pink-500/25 dark:text-pink-100',
  bug: 'border border-lime-300 bg-lime-200 text-lime-700 dark:border-lime-400/40 dark:bg-lime-500/25 dark:text-lime-100',
  rock: 'border border-yellow-400 bg-yellow-300 text-yellow-800 dark:border-yellow-400/40 dark:bg-yellow-500/25 dark:text-yellow-100',
  ghost:
    'border border-violet-300 bg-violet-200 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/25 dark:text-violet-100',
  dragon:
    'border border-indigo-400 bg-indigo-300 text-indigo-800 dark:border-indigo-400/40 dark:bg-indigo-500/25 dark:text-indigo-100',
  dark: 'border border-slate-400 bg-slate-300 text-slate-800 dark:border-slate-500/40 dark:bg-slate-500/30 dark:text-slate-100',
  steel:
    'border border-zinc-300 bg-zinc-200 text-zinc-700 dark:border-zinc-500/40 dark:bg-zinc-500/30 dark:text-zinc-100',
  fairy:
    'border border-rose-300 bg-rose-200 text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/25 dark:text-rose-100',
};

export function getTypeBadgeClass(type: string) {
  return (
    typeColorMap[type.toLowerCase()] ??
    'border border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-500/40 dark:bg-slate-500/30 dark:text-slate-100'
  );
}

export function getPokemonArtwork(pokemon: Pokemon) {
  return (
    pokemon.sprites.other?.['official-artwork']?.front_default ??
    pokemon.sprites.front_default ??
    ''
  );
}

export function formatHeight(height: number): string {
  return `${(height / 10).toFixed(1)} m`;
}

export function formatWeight(weight: number): string {
  return `${(weight / 10).toFixed(1)} kg`;
}
