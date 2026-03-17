import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPokemonByName, getPokemonList } from '@/services/api/pokemonApi';
import { usePokemonCacheStore } from '@/store/usePokemonCacheStore';
import type { Pokemon } from '@/types/pokemon';

type RankingStatKey = 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed';

type RankingMetricKey = RankingStatKey | 'height' | 'weight';

export type RankingCategory = {
  key: RankingMetricKey;
  title: string;
  unit: string;
  valueLabel: string;
};

export type RankedPokemon = {
  pokemon: Pokemon;
  value: number;
};

export type RankingSection = {
  category: RankingCategory;
  items: RankedPokemon[];
};

type UsePokemonRankingsResult = {
  rankings: RankingSection[];
  loading: boolean;
  error: string | null;
  warning: string | null;
  reloadRankings: () => void;
};

const SAMPLE_SIZE = 386;
const TOP_LIMIT = 10;
const FETCH_BATCH_SIZE = 24;

const CATEGORIES: RankingCategory[] = [
  {
    key: 'hp',
    title: 'Highest HP',
    unit: '',
    valueLabel: 'HP',
  },
  {
    key: 'attack',
    title: 'Highest attack',
    unit: '',
    valueLabel: 'ATK',
  },
  {
    key: 'defense',
    title: 'Highest defense',
    unit: '',
    valueLabel: 'DEF',
  },
  {
    key: 'special-attack',
    title: 'Highest special attack',
    unit: '',
    valueLabel: 'SpA',
  },
  {
    key: 'special-defense',
    title: 'Highest special defense',
    unit: '',
    valueLabel: 'SpD',
  },
  {
    key: 'speed',
    title: 'Highest speed',
    unit: '',
    valueLabel: 'SPD',
  },
  {
    key: 'height',
    title: 'Tallest Pokemon',
    unit: ' m',
    valueLabel: 'ALT',
  },
  {
    key: 'weight',
    title: 'Heaviest Pokemon',
    unit: ' kg',
    valueLabel: 'PES',
  },
];

function getPokemonStatValue(pokemon: Pokemon, statName: RankingStatKey): number {
  return pokemon.stats.find((entry) => entry.stat.name === statName)?.base_stat ?? 0;
}

function getRankingValue(pokemon: Pokemon, key: RankingCategory['key']): number {
  if (key !== 'height' && key !== 'weight') {
    return getPokemonStatValue(pokemon, key);
  }

  return pokemon[key];
}

function buildTopRanking(pokemons: Pokemon[], category: RankingCategory): RankedPokemon[] {
  return pokemons
    .map((pokemon) => ({
      pokemon,
      value: getRankingValue(pokemon, category.key),
    }))
    .sort((left, right) => {
      if (right.value !== left.value) {
        return right.value - left.value;
      }

      return left.pokemon.id - right.pokemon.id;
    })
    .slice(0, TOP_LIMIT);
}

export function usePokemonRankings(): UsePokemonRankingsResult {
  const setPokemons = usePokemonCacheStore((state) => state.setPokemons);

  const [pokemons, setPokemonsState] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const requestIdRef = useRef(0);

  const reloadRankings = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    async function loadRankingDataset() {
      setLoading(true);
      setError(null);
      setWarning(null);

      try {
        const listResponse = await getPokemonList(1, 0);
        const limit = Math.min(listResponse.count, SAMPLE_SIZE);
        const dataset = await getPokemonList(limit, 0);

        if (requestId !== requestIdRef.current) {
          return;
        }

        const names = dataset.results.map((item) => item.name);
        const cached = usePokemonCacheStore.getState().pokemonByName;
        const collected: Pokemon[] = [];
        const missingNames: string[] = [];

        names.forEach((name) => {
          const pokemon = cached[name.toLowerCase()];

          if (pokemon) {
            collected.push(pokemon);
          } else {
            missingNames.push(name);
          }
        });

        for (let index = 0; index < missingNames.length; index += FETCH_BATCH_SIZE) {
          const slice = missingNames.slice(index, index + FETCH_BATCH_SIZE);
          const fetched = await Promise.allSettled(slice.map((name) => getPokemonByName(name)));

          if (requestId !== requestIdRef.current) {
            return;
          }

          fetched.forEach((result) => {
            if (result.status === 'fulfilled') {
              collected.push(result.value);
            }
          });
        }

        const uniqueMap = new Map<number, Pokemon>();
        collected.forEach((pokemon) => {
          uniqueMap.set(pokemon.id, pokemon);
        });

        const finalList = Array.from(uniqueMap.values());

        if (finalList.length === 0) {
          throw new Error('No dataset');
        }

        if (requestId !== requestIdRef.current) {
          return;
        }

        setPokemonsState(finalList);
        setPokemons(finalList);

        if (finalList.length < limit) {
          setWarning(`Se cargaron ${finalList.length} de ${limit} Pokemon para el ranking.`);
        }
      } catch {
        if (requestId === requestIdRef.current) {
          setError('No se pudo cargar el ranking de Pokemon.');
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    void loadRankingDataset();
  }, [reloadKey, setPokemons]);

  const rankings = useMemo(() => {
    return CATEGORIES.map((category) => ({
      category,
      items: buildTopRanking(pokemons, category),
    }));
  }, [pokemons]);

  return {
    rankings,
    loading,
    error,
    warning,
    reloadRankings,
  };
}
