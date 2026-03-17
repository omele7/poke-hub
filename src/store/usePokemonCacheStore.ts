import { create } from 'zustand';
import type { Pokemon } from '@/types/pokemon';

type PokemonCacheState = {
  pokemonByName: Record<string, Pokemon>;
  pokemonTypeIndex: Record<string, string[]>;
  setPokemon: (pokemon: Pokemon) => void;
  setPokemons: (pokemons: Pokemon[]) => void;
  setPokemonTypeIndex: (type: string, pokemonNames: string[]) => void;
};

export const usePokemonCacheStore = create<PokemonCacheState>((set) => ({
  pokemonByName: {},
  pokemonTypeIndex: {},
  setPokemon: (pokemon) =>
    set((state) => ({
      pokemonByName: {
        ...state.pokemonByName,
        [pokemon.name.toLowerCase()]: pokemon,
      },
    })),
  setPokemons: (pokemons) =>
    set((state) => {
      const next = { ...state.pokemonByName };

      pokemons.forEach((pokemon) => {
        next[pokemon.name.toLowerCase()] = pokemon;
      });

      return { pokemonByName: next };
    }),
  setPokemonTypeIndex: (type, pokemonNames) =>
    set((state) => ({
      pokemonTypeIndex: {
        ...state.pokemonTypeIndex,
        [type.toLowerCase()]: pokemonNames.map((name) => name.toLowerCase()),
      },
    })),
}));
