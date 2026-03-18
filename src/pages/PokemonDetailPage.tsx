import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { PokemonAbilities } from '@/features/pokemon/components/PokemonAbilities';
import { PokemonEvolutionChain } from '@/features/pokemon/components/PokemonEvolutionChain';
import { PokemonHeader } from '@/features/pokemon/components/PokemonHeader';
import { PokemonMoves } from '@/features/pokemon/components/PokemonMoves';
import { PokemonStats } from '@/features/pokemon/components/PokemonStats';
import { ApiError } from '@/services/api/errors';
import { getEvolutionChain, getPokemonByName, getPokemonSpecies } from '@/services/api/pokemonApi';
import { usePokemonCacheStore } from '@/store/usePokemonCacheStore';
import type { EvolutionChainLink, Pokemon, PokemonSpecies } from '@/types/pokemon';

type EvolutionPreviewItem = {
  name: string;
  sprite: string | null;
};

function flattenEvolutionChain(link: EvolutionChainLink): string[] {
  const names = [link.species.name.toLowerCase()];

  link.evolves_to.forEach((nextLink) => {
    names.push(...flattenEvolutionChain(nextLink));
  });

  return names;
}

function uniqueNames(names: string[]): string[] {
  return Array.from(new Set(names));
}

function normalizeFlavorText(value: string): string {
  return value
    .replace(/[\n\f\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPokedexDescription(species: PokemonSpecies): string | null {
  const entries = species.flavor_text_entries ?? [];
  const normalizedEntries = [...entries].reverse();

  const preferredEntry =
    normalizedEntries.find(
      (entry) => entry.language.name === 'es' && Boolean(entry.flavor_text.trim()),
    ) ??
    normalizedEntries.find(
      (entry) => entry.language.name === 'en' && Boolean(entry.flavor_text.trim()),
    );

  return preferredEntry ? normalizeFlavorText(preferredEntry.flavor_text) : null;
}

async function resolveEvolutionPokemonName(speciesName: string): Promise<string | null> {
  const normalized = speciesName.toLowerCase();
  const cache = usePokemonCacheStore.getState().pokemonByName;

  if (cache[normalized]) {
    return normalized;
  }

  try {
    await getPokemonByName(normalized);
    return normalized;
  } catch {
    // Some evolution species names are not directly available in /pokemon, use species varieties.
  }

  try {
    const species = await getPokemonSpecies(normalized);
    const varietyNames = species.varieties.map((entry) => entry.pokemon.name.toLowerCase());
    const defaultVarietyName =
      species.varieties.find((entry) => entry.is_default)?.pokemon.name.toLowerCase() ?? null;
    const candidates = uniqueNames([
      ...(defaultVarietyName ? [defaultVarietyName] : []),
      ...varietyNames,
    ]);

    for (const candidate of candidates) {
      const freshCache = usePokemonCacheStore.getState().pokemonByName;
      if (freshCache[candidate]) {
        return candidate;
      }

      try {
        await getPokemonByName(candidate);
        return candidate;
      } catch {
        // Try next variety.
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function PokemonDetailPage() {
  const { name: routeName } = useParams();
  const normalizedName = (routeName ?? '').toLowerCase();

  const setPokemon = usePokemonCacheStore((state) => state.setPokemon);
  const setPokemons = usePokemonCacheStore((state) => state.setPokemons);

  const [pokemon, setPokemonState] = useState<Pokemon | null>(null);
  const [pokedexDescription, setPokedexDescription] = useState<string | null>(null);
  const [evolutionItems, setEvolutionItems] = useState<EvolutionPreviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvolution, setLoadingEvolution] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evolutionWarning, setEvolutionWarning] = useState<string | null>(null);
  const [retrySeed, setRetrySeed] = useState(0);

  useEffect(() => {
    if (!normalizedName) {
      setPokemonState(null);
      setPokedexDescription(null);
      setEvolutionItems([]);
      setLoading(false);
      setLoadingEvolution(false);
      setError('Pokemon no valido.');
      setEvolutionWarning(null);
      return;
    }

    let cancelled = false;

    async function loadPokemonDetail() {
      let selectedPokemon: Pokemon | null = null;

      setLoading(true);
      setLoadingEvolution(true);
      setError(null);
      setEvolutionWarning(null);
      setPokedexDescription(null);
      setEvolutionItems([]);

      try {
        const cache = usePokemonCacheStore.getState().pokemonByName;
        const cached = cache[normalizedName];
        selectedPokemon = cached ?? (await getPokemonByName(normalizedName));

        if (!cached) {
          setPokemon(selectedPokemon);
        }

        if (cancelled) {
          return;
        }

        setPokemonState(selectedPokemon);
        setLoading(false);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 404) {
          setError('No encontramos ese pokemon.');
          setPokemonState(null);
        } else {
          setError('No se pudo cargar el detalle del pokemon.');
          setPokemonState(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }

      if (cancelled || !selectedPokemon) {
        return;
      }

      try {
        // For forms like mega evolutions, species endpoint should use species.name, not pokemon.name.
        const species = await getPokemonSpecies(selectedPokemon.species.name);
        setPokedexDescription(getPokedexDescription(species));
        const chain = await getEvolutionChain(species.evolution_chain.url);
        const names = uniqueNames(flattenEvolutionChain(chain.chain));

        const resolvedResults = await Promise.all(
          names.map(async (speciesName) => {
            const resolvedName = await resolveEvolutionPokemonName(speciesName);
            return {
              speciesName,
              resolvedName,
            };
          }),
        );

        const resolvedNames = uniqueNames(
          resolvedResults
            .map((result) => result.resolvedName)
            .filter((name): name is string => Boolean(name)),
        );

        if (resolvedNames.length === 0) {
          throw new Error('No valid evolution entries');
        }

        const cacheAfterSpecies = usePokemonCacheStore.getState().pokemonByName;
        const missingNames = resolvedNames.filter((pokemonName) => !cacheAfterSpecies[pokemonName]);

        if (missingNames.length > 0) {
          const fetchedResults = await Promise.allSettled(
            missingNames.map((pokemonName) => getPokemonByName(pokemonName)),
          );

          const fetchedPokemons = fetchedResults
            .filter(
              (result): result is PromiseFulfilledResult<Pokemon> => result.status === 'fulfilled',
            )
            .map((result) => result.value);

          if (fetchedPokemons.length > 0) {
            setPokemons(fetchedPokemons);
          }
        }

        if (cancelled) {
          return;
        }

        const fullCache = usePokemonCacheStore.getState().pokemonByName;
        const previews = resolvedNames.map((pokemonName) => {
          const item = fullCache[pokemonName];
          return {
            name: pokemonName,
            sprite:
              item?.sprites.other?.['official-artwork']?.front_default ??
              item?.sprites.front_default ??
              null,
          };
        });

        setEvolutionItems(previews);

        if (resolvedNames.length < names.length) {
          setEvolutionWarning(
            'Mostramos una version compatible de algunas evoluciones especiales.',
          );
        }
      } catch {
        if (!cancelled) {
          setPokedexDescription(null);
          setEvolutionItems([]);
          setEvolutionWarning('No pudimos cargar la cadena evolutiva de esta forma.');
        }
      } finally {
        if (!cancelled) {
          setLoadingEvolution(false);
        }
      }
    }

    void loadPokemonDetail();

    return () => {
      cancelled = true;
    };
  }, [normalizedName, retrySeed, setPokemon, setPokemons]);

  const pageTitle = useMemo(() => {
    if (!pokemon) {
      return 'Detalle Pokemon';
    }

    return `Detalle de ${pokemon.name}`;
  }, [pokemon]);

  return (
    <AppShell>
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pokedex</p>
            <h1 className="text-2xl font-bold tracking-tight text-ink">{pageTitle}</h1>
          </div>
          <Link
            to="/"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky/30"
          >
            Volver a inicio
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">{error}</p>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => setRetrySeed((seed) => seed + 1)}
            >
              Reintentar
            </Button>
          </div>
        ) : null}

        {!loading && !error && pokemon ? (
          <>
            <PokemonHeader pokemon={pokemon} />

            {pokedexDescription ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Descripcion de la Pokedex
                </h2>
                <p className="text-sm leading-7 text-slate-700">{pokedexDescription}</p>
              </section>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Stats base
                </h2>
                <PokemonStats stats={pokemon.stats} />
              </section>
              <PokemonAbilities abilities={pokemon.abilities} />
            </div>

            <PokemonMoves moves={pokemon.moves} />

            <PokemonEvolutionChain
              items={evolutionItems}
              currentPokemonName={pokemon.name}
              loading={loadingEvolution}
            />
            {evolutionWarning ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                {evolutionWarning}
              </p>
            ) : null}
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
