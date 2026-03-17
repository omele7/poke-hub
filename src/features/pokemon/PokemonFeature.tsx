import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PokemonDetailModal } from '@/features/pokemon/components/PokemonDetailModal';
import { PokemonFilters } from '@/features/pokemon/components/PokemonFilters';
import { PokemonGrid } from '@/features/pokemon/components/PokemonGrid';
import { PokemonSearch } from '@/features/pokemon/components/PokemonSearch';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ApiError } from '@/services/api/errors';
import { getPokemonByName, getPokemonList, getPokemonType } from '@/services/api/pokemonApi';
import { usePokemonCacheStore } from '@/store/usePokemonCacheStore';
import type { Pokemon } from '@/types/pokemon';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;
const POKEMON_TYPE_OPTIONS = [
  'all',
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
];

type ViewMode = 'all' | 'type' | 'search';

function extractIdFromResourceUrl(url: string): number {
  const matched = url.match(/\/(\d+)\/?$/);
  return matched ? Number(matched[1]) : Number.MAX_SAFE_INTEGER;
}

function mergeUniquePokemon(current: Pokemon[], incoming: Pokemon[]): Pokemon[] {
  const merged = new Map<number, Pokemon>();

  current.forEach((pokemon) => {
    merged.set(pokemon.id, pokemon);
  });

  incoming.forEach((pokemon) => {
    merged.set(pokemon.id, pokemon);
  });

  return Array.from(merged.values());
}

export function PokemonFeature() {
  const setPokemon = usePokemonCacheStore((state) => state.setPokemon);
  const setPokemons = usePokemonCacheStore((state) => state.setPokemons);
  const setPokemonTypeIndex = usePokemonCacheStore((state) => state.setPokemonTypeIndex);

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput.trim().toLowerCase(), SEARCH_DEBOUNCE_MS);
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [pokemons, setPokemonsView] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allOffset, setAllOffset] = useState(0);
  const [typeNames, setTypeNames] = useState<string[]>([]);
  const [typeCursor, setTypeCursor] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [pokemonNameOptions, setPokemonNameOptions] = useState<string[]>([]);
  const [isLoadingNameOptions, setIsLoadingNameOptions] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const viewVersionRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function loadPokemonNameOptions() {
      try {
        setIsLoadingNameOptions(true);
        const firstPage = await getPokemonList(1, 0);
        const list = await getPokemonList(firstPage.count, 0);

        if (cancelled) {
          return;
        }

        setPokemonNameOptions(list.results.map((item) => item.name));
      } catch {
        if (!cancelled) {
          setPokemonNameOptions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingNameOptions(false);
        }
      }
    }

    void loadPokemonNameOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  const resolvePokemonDetails = useCallback(
    async (pokemonNames: string[]): Promise<Pokemon[]> => {
      const normalizedNames = pokemonNames
        .map((name) => name.toLowerCase())
        .filter((name) => name.length > 0);

      if (normalizedNames.length === 0) {
        return [];
      }

      const { pokemonByName } = usePokemonCacheStore.getState();
      const missingNames: string[] = [];

      normalizedNames.forEach((name) => {
        if (!pokemonByName[name]) {
          missingNames.push(name);
        }
      });

      if (missingNames.length > 0) {
        const fetched = await Promise.all(missingNames.map((name) => getPokemonByName(name)));
        setPokemons(fetched);
      }

      const freshCache = usePokemonCacheStore.getState().pokemonByName;
      return normalizedNames
        .map((name) => freshCache[name])
        .filter((pokemon): pokemon is Pokemon => Boolean(pokemon));
    },
    [setPokemons],
  );

  const getTypePokemonNames = useCallback(
    async (type: string): Promise<string[]> => {
      const normalizedType = type.toLowerCase();
      const cachedTypeNames = usePokemonCacheStore.getState().pokemonTypeIndex[normalizedType];

      if (cachedTypeNames) {
        return cachedTypeNames;
      }

      const response = await getPokemonType(normalizedType);
      const sortedNames = response.pokemon
        .slice()
        .sort((left, right) => {
          const leftId = extractIdFromResourceUrl(left.pokemon.url);
          const rightId = extractIdFromResourceUrl(right.pokemon.url);
          return leftId - rightId;
        })
        .map((entry) => entry.pokemon.name.toLowerCase());

      setPokemonTypeIndex(normalizedType, sortedNames);
      return sortedNames;
    },
    [setPokemonTypeIndex],
  );

  const fetchAllPage = useCallback(
    async (offset: number) => {
      const response = await getPokemonList(PAGE_SIZE, offset);
      const names = response.results.map((item) => item.name);
      const details = await resolvePokemonDetails(names);

      return {
        details,
        hasNextPage: Boolean(response.next),
        nextOffset: offset + PAGE_SIZE,
      };
    },
    [resolvePokemonDetails],
  );

  const fetchTypePage = useCallback(
    async (type: string, cursor: number, pool?: string[]) => {
      const source = pool ?? (await getTypePokemonNames(type));
      const namesToFetch = source.slice(cursor, cursor + PAGE_SIZE);
      const details = await resolvePokemonDetails(namesToFetch);
      const nextCursor = cursor + namesToFetch.length;

      return {
        details,
        names: source,
        nextCursor,
        hasNextPage: nextCursor < source.length,
      };
    },
    [getTypePokemonNames, resolvePokemonDetails],
  );

  useEffect(() => {
    const version = viewVersionRef.current + 1;
    viewVersionRef.current = version;

    setError(null);
    setSelectedPokemon(null);
    setPokemonsView([]);
    setAllOffset(0);
    setTypeCursor(0);
    setTypeNames([]);
    setHasMore(false);
    setIsLoadingMore(false);
    setIsLoadingInitial(true);

    async function bootstrapView() {
      try {
        if (debouncedSearch) {
          setViewMode('search');
          const cachedPokemon = usePokemonCacheStore.getState().pokemonByName[debouncedSearch];
          const pokemon = cachedPokemon ?? (await getPokemonByName(debouncedSearch));

          if (!cachedPokemon) {
            setPokemon(pokemon);
          }

          const typeMatch =
            selectedType === 'all' ||
            pokemon.types.some(
              (slot) => slot.type.name.toLowerCase() === selectedType.toLowerCase(),
            );

          if (version !== viewVersionRef.current) {
            return;
          }

          setPokemonsView(typeMatch ? [pokemon] : []);
          setHasMore(false);
          return;
        }

        if (selectedType === 'all') {
          setViewMode('all');
          const firstPage = await fetchAllPage(0);

          if (version !== viewVersionRef.current) {
            return;
          }

          setPokemonsView(firstPage.details);
          setAllOffset(firstPage.nextOffset);
          setHasMore(firstPage.hasNextPage);
          return;
        }

        setViewMode('type');
        const firstTypePage = await fetchTypePage(selectedType, 0);

        if (version !== viewVersionRef.current) {
          return;
        }

        setTypeNames(firstTypePage.names);
        setTypeCursor(firstTypePage.nextCursor);
        setPokemonsView(firstTypePage.details);
        setHasMore(firstTypePage.hasNextPage);
      } catch (fetchError) {
        if (version !== viewVersionRef.current) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 404) {
          setPokemonsView([]);
          setError(null);
        } else {
          setError('No se pudo cargar la Pokedex. Intenta nuevamente.');
        }
      } finally {
        if (version === viewVersionRef.current) {
          setIsLoadingInitial(false);
        }
      }
    }

    void bootstrapView();
  }, [debouncedSearch, fetchAllPage, fetchTypePage, reloadKey, selectedType, setPokemon]);

  const loadMore = useCallback(async () => {
    if (isLoadingInitial || isLoadingMore || !hasMore || viewMode === 'search') {
      return;
    }

    const version = viewVersionRef.current;
    setIsLoadingMore(true);

    try {
      if (viewMode === 'all') {
        const nextPage = await fetchAllPage(allOffset);

        if (version !== viewVersionRef.current) {
          return;
        }

        setPokemonsView((current) => mergeUniquePokemon(current, nextPage.details));
        setAllOffset(nextPage.nextOffset);
        setHasMore(nextPage.hasNextPage);
        return;
      }

      if (viewMode === 'type') {
        const nextPage = await fetchTypePage(selectedType, typeCursor, typeNames);

        if (version !== viewVersionRef.current) {
          return;
        }

        setPokemonsView((current) => mergeUniquePokemon(current, nextPage.details));
        setTypeNames(nextPage.names);
        setTypeCursor(nextPage.nextCursor);
        setHasMore(nextPage.hasNextPage);
      }
    } catch {
      if (version === viewVersionRef.current) {
        setError('No se pudieron cargar mas pokemon.');
      }
    } finally {
      if (version === viewVersionRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [
    allOffset,
    fetchAllPage,
    fetchTypePage,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    selectedType,
    typeCursor,
    typeNames,
    viewMode,
  ]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasMore || isLoadingInitial || viewMode === 'search') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingInitial, loadMore, viewMode]);

  const emptyMessage = useMemo(() => {
    if (debouncedSearch) {
      return 'No encontramos pokemon con ese nombre.';
    }

    if (selectedType !== 'all') {
      return 'No hay pokemon disponibles para este tipo.';
    }

    return 'No hay pokemon para mostrar.';
  }, [debouncedSearch, selectedType]);

  return (
    <section className="space-y-5">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-sky/10" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-amber/10" />

        <div className="relative">
          <p className="inline-flex rounded-full bg-amber/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink">
            Pokehub
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">Pokedex</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Explora pokemon por nombre o tipo. Haz click en una tarjeta para abrir el detalle.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px]">
            <PokemonSearch
              value={searchInput}
              onChange={setSearchInput}
              options={pokemonNameOptions}
              loadingOptions={isLoadingNameOptions}
            />
            <PokemonFilters
              value={selectedType}
              onChange={setSelectedType}
              options={POKEMON_TYPE_OPTIONS}
            />
          </div>
        </div>
      </header>

      {error ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">{error}</p>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Reintentar
          </Button>
        </div>
      ) : null}

      <PokemonGrid
        pokemons={pokemons}
        loading={isLoadingInitial}
        loadingMore={isLoadingMore}
        onSelect={setSelectedPokemon}
        emptyMessage={emptyMessage}
      />

      {hasMore && !isLoadingInitial ? (
        <div
          ref={sentinelRef}
          className="flex h-12 items-center justify-center text-xs font-semibold text-slate-500"
        >
          {isLoadingMore ? 'Cargando mas pokemon...' : 'Desliza para cargar mas'}
        </div>
      ) : null}

      <PokemonDetailModal pokemon={selectedPokemon} onClose={() => setSelectedPokemon(null)} />
    </section>
  );
}
