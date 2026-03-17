import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPokemonByName, getPokemonList, getPokemonType } from '@/services/api/pokemonApi';
import { usePokemonCacheStore } from '@/store/usePokemonCacheStore';
import type { Pokemon, TypeDamageRelations } from '@/types/pokemon';

const TEAM_SIZE = 6;
const DEFAULT_MAX_POKEMON = 1025;
const POKEMON_FETCH_RETRIES = 2;
const TYPE_FETCH_RETRIES = 2;
const TEAM_GENERATION_MAX_ROUNDS = 5;
const RETRY_DELAY_MS = 250;
const ATTACKING_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

export type TeamWeakness = {
  type: string;
  weakMembers: number;
  averageMultiplier: number;
};

type UseRandomTeamBuilderResult = {
  team: Pokemon[];
  loading: boolean;
  error: string | null;
  weaknessWarning: string | null;
  weaknesses: TeamWeakness[];
  generateRandomTeam: () => Promise<void>;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function pickRandomUniqueIds(total: number, amount: number, excludedIds: Set<number>): number[] {
  const picked = new Set<number>();

  while (picked.size < amount && excludedIds.size + picked.size < total) {
    const randomId = Math.floor(Math.random() * total) + 1;

    if (!excludedIds.has(randomId)) {
      picked.add(randomId);
    }
  }

  return Array.from(picked);
}

function getDamageMultiplierAgainstPokemon(
  attackingType: string,
  defendingPokemon: Pokemon,
  damageProfiles: Record<string, TypeDamageRelations>,
): number {
  return defendingPokemon.types.reduce((multiplier, slot) => {
    const profile = damageProfiles[slot.type.name.toLowerCase()];

    if (!profile) {
      return multiplier;
    }

    if (profile.no_damage_from.some((entry) => entry.name === attackingType)) {
      return multiplier * 0;
    }

    if (profile.double_damage_from.some((entry) => entry.name === attackingType)) {
      return multiplier * 2;
    }

    if (profile.half_damage_from.some((entry) => entry.name === attackingType)) {
      return multiplier * 0.5;
    }

    return multiplier;
  }, 1);
}

export function useRandomTeamBuilder(): UseRandomTeamBuilderResult {
  const setPokemonsInCache = usePokemonCacheStore((state) => state.setPokemons);

  const [team, setTeam] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weaknessWarning, setWeaknessWarning] = useState<string | null>(null);
  const [maxPokemonCount, setMaxPokemonCount] = useState<number | null>(null);
  const [typeDamageProfiles, setTypeDamageProfiles] = useState<Record<string, TypeDamageRelations>>(
    {},
  );

  const hasBootstrappedRef = useRef(false);
  const generationIdRef = useRef(0);

  const ensureMaxPokemonCount = useCallback(async () => {
    if (maxPokemonCount !== null && maxPokemonCount > 0) {
      return maxPokemonCount;
    }

    try {
      const response = await getPokemonList(1, 0);
      setMaxPokemonCount(response.count);
      return response.count;
    } catch {
      return DEFAULT_MAX_POKEMON;
    }
  }, [maxPokemonCount]);

  const fetchPokemonByIdWithRetry = useCallback(async (id: number): Promise<Pokemon> => {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= POKEMON_FETCH_RETRIES) {
      try {
        return await getPokemonByName(String(id));
      } catch (fetchError) {
        lastError = fetchError;
        attempt += 1;

        if (attempt <= POKEMON_FETCH_RETRIES) {
          await delay(RETRY_DELAY_MS * attempt);
        }
      }
    }

    throw lastError;
  }, []);

  const fetchTypeProfileWithRetry = useCallback(
    async (type: string): Promise<TypeDamageRelations | null> => {
      let attempt = 0;

      while (attempt <= TYPE_FETCH_RETRIES) {
        try {
          const details = await getPokemonType(type);
          return details.damage_relations;
        } catch {
          attempt += 1;

          if (attempt <= TYPE_FETCH_RETRIES) {
            await delay(RETRY_DELAY_MS * attempt);
          }
        }
      }

      return null;
    },
    [],
  );

  const ensureDamageProfiles = useCallback(
    async (pokemons: Pokemon[]): Promise<boolean> => {
      const uniqueTypes = Array.from(
        new Set(
          pokemons.flatMap((pokemon) => pokemon.types.map((slot) => slot.type.name.toLowerCase())),
        ),
      );

      const missingTypes = uniqueTypes.filter((type) => !typeDamageProfiles[type]);

      if (missingTypes.length === 0) {
        return true;
      }

      const fetched = await Promise.all(
        missingTypes.map(async (type) => {
          const profile = await fetchTypeProfileWithRetry(type);
          return { type, profile };
        }),
      );

      setTypeDamageProfiles((current) => {
        const next = { ...current };
        fetched.forEach((entry) => {
          if (entry.profile) {
            next[entry.type] = entry.profile;
          }
        });
        return next;
      });

      return fetched.every((entry) => Boolean(entry.profile));
    },
    [fetchTypeProfileWithRetry, typeDamageProfiles],
  );

  const generateRandomTeam = useCallback(async () => {
    const currentGenerationId = generationIdRef.current + 1;
    generationIdRef.current = currentGenerationId;

    setLoading(true);
    setError(null);
    setWeaknessWarning(null);

    try {
      const count = await ensureMaxPokemonCount();

      if (currentGenerationId !== generationIdRef.current) {
        return;
      }

      const attemptedIds = new Set<number>();
      const collected = new Map<number, Pokemon>();
      let round = 0;

      while (
        collected.size < TEAM_SIZE &&
        attemptedIds.size < count &&
        round < TEAM_GENERATION_MAX_ROUNDS
      ) {
        const pending = TEAM_SIZE - collected.size;
        const batchSize = Math.min(Math.max(pending * 3, TEAM_SIZE), count - attemptedIds.size);
        const batchIds = pickRandomUniqueIds(count, batchSize, attemptedIds);

        batchIds.forEach((id) => {
          attemptedIds.add(id);
        });

        const results = await Promise.allSettled(
          batchIds.map((id) => fetchPokemonByIdWithRetry(id)),
        );

        if (currentGenerationId !== generationIdRef.current) {
          return;
        }

        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            collected.set(result.value.id, result.value);
          }
        });

        round += 1;
      }

      const randomTeam = Array.from(collected.values()).slice(0, TEAM_SIZE);

      if (randomTeam.length < TEAM_SIZE) {
        throw new Error('INCOMPLETE_TEAM');
      }

      if (currentGenerationId !== generationIdRef.current) {
        return;
      }

      setTeam(randomTeam);
      setPokemonsInCache(randomTeam);
      const allProfilesLoaded = await ensureDamageProfiles(randomTeam);

      if (currentGenerationId !== generationIdRef.current) {
        return;
      }

      if (!allProfilesLoaded) {
        setWeaknessWarning('Algunas debilidades pueden verse incompletas por limites de la API.');
      }
    } catch {
      setError('No se pudo generar el equipo. Intenta nuevamente.');
    } finally {
      if (currentGenerationId === generationIdRef.current) {
        setLoading(false);
      }
    }
  }, [ensureDamageProfiles, ensureMaxPokemonCount, fetchPokemonByIdWithRetry, setPokemonsInCache]);

  useEffect(() => {
    if (hasBootstrappedRef.current) {
      return;
    }

    hasBootstrappedRef.current = true;
    void generateRandomTeam();
  }, [generateRandomTeam]);

  const weaknesses = useMemo<TeamWeakness[]>(() => {
    if (team.length === 0) {
      return [];
    }

    const rows: TeamWeakness[] = ATTACKING_TYPES.map((attackingType) => {
      let weakMembers = 0;
      let multiplierSum = 0;

      team.forEach((pokemon) => {
        const multiplier = getDamageMultiplierAgainstPokemon(
          attackingType,
          pokemon,
          typeDamageProfiles,
        );

        if (multiplier > 1) {
          weakMembers += 1;
          multiplierSum += multiplier;
        }
      });

      return {
        type: attackingType,
        weakMembers,
        averageMultiplier: weakMembers > 0 ? multiplierSum / weakMembers : 0,
      };
    });

    return rows
      .filter((row) => row.weakMembers > 0)
      .sort((left, right) => {
        if (right.weakMembers !== left.weakMembers) {
          return right.weakMembers - left.weakMembers;
        }

        return right.averageMultiplier - left.averageMultiplier;
      });
  }, [team, typeDamageProfiles]);

  return {
    team,
    loading,
    error,
    weaknessWarning,
    weaknesses,
    generateRandomTeam,
  };
}
