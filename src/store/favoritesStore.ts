import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Pokemon, PokemonStat, PokemonTypeSlot } from '@/types/pokemon';

type FavoritePokemon = {
  id: number;
  name: string;
  sprite: string | null;
  types: PokemonTypeSlot[];
  stats: PokemonStat[];
};

type FavoritesStore = {
  favorites: FavoritePokemon[];
  addFavorite: (pokemon: Pokemon) => void;
  removeFavorite: (pokemonId: number) => void;
  getFavorites: () => FavoritePokemon[];
  isFavorite: (pokemonId: number) => boolean;
};

const emptyStorage: Storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
};

function toFavoritePokemon(pokemon: Pokemon): FavoritePokemon {
  return {
    id: pokemon.id,
    name: pokemon.name,
    sprite:
      pokemon.sprites.other?.['official-artwork']?.front_default ?? pokemon.sprites.front_default,
    types: pokemon.types,
    stats: pokemon.stats,
  };
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (pokemon) =>
        set((state) => {
          if (state.favorites.some((favorite) => favorite.id === pokemon.id)) {
            return state;
          }

          return {
            favorites: [...state.favorites, toFavoritePokemon(pokemon)],
          };
        }),
      removeFavorite: (pokemonId) =>
        set((state) => ({
          favorites: state.favorites.filter((favorite) => favorite.id !== pokemonId),
        })),
      getFavorites: () => get().favorites,
      isFavorite: (pokemonId) => get().favorites.some((favorite) => favorite.id === pokemonId),
    }),
    {
      name: 'pokehub-favorites',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.localStorage : emptyStorage,
      ),
      partialize: (state) => ({ favorites: state.favorites }),
    },
  ),
);

export type { FavoritePokemon };
