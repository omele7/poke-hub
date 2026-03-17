import { useEffect, useState } from 'react';
import { getPokemonByName } from '@/services/api/pokemonApi';
import type { Pokemon } from '@/types/pokemon';

type UsePokemonResult = {
  pokemon: Pokemon | null;
  loading: boolean;
  error: string | null;
};

export function usePokemon(name: string): UsePokemonResult {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPokemon() {
      setLoading(true);
      setError(null);

      try {
        const data = await getPokemonByName(name);
        if (isMounted) {
          setPokemon(data);
        }
      } catch {
        if (isMounted) {
          setError('No se pudo cargar el pokemon.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void fetchPokemon();

    return () => {
      isMounted = false;
    };
  }, [name]);

  return { pokemon, loading, error };
}
