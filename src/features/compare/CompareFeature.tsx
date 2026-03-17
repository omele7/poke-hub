import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getPokemonByName, getPokemonList } from '@/services/api/pokemonApi';
import { usePokemonCacheStore } from '@/store/usePokemonCacheStore';
import type { Pokemon } from '@/types/pokemon';
import { getPokemonArtwork, getTypeBadgeClass } from '@/features/pokemon/utils/pokemonUi';

type ComparedStat = 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed';

type CompareCardProps = {
  label: string;
  name: string;
  onNameChange: (value: string) => void;
  pokemon: Pokemon | null;
  loading: boolean;
  error: string | null;
  options: string[];
};

type StatRowProps = {
  label: string;
  leftValue: number;
  rightValue: number;
  animate: boolean;
};

const COMPARED_STATS: Array<{ key: ComparedStat; label: string }> = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'special-attack', label: 'Special Attack' },
  { key: 'special-defense', label: 'Special Defense' },
  { key: 'speed', label: 'Speed' },
];

const MAX_BAR_VALUE = 200;

function getStatValue(pokemon: Pokemon, stat: ComparedStat): number {
  return pokemon.stats.find((entry) => entry.stat.name === stat)?.base_stat ?? 0;
}

function CompareCard({
  label,
  name,
  onNameChange,
  pokemon,
  loading,
  error,
  options,
}: CompareCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>

      <div className="mt-3">
        <input
          list="pokemon-compare-options"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Ej: pikachu"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-sky focus:ring-4 focus:ring-sky/20"
        />
        <datalist id="pokemon-compare-options">
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      {loading ? <p className="mt-3 text-sm text-slate-500">Cargando...</p> : null}
      {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}

      {pokemon ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <img
            src={getPokemonArtwork(pokemon)}
            alt={pokemon.name}
            className="mx-auto h-28 w-28 object-contain"
          />
          <h3 className="mt-2 text-center text-lg font-bold capitalize text-ink">{pokemon.name}</h3>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {pokemon.types.map((slot) => (
              <span
                key={slot.type.name}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-black/5 dark:ring-white/10 ${getTypeBadgeClass(slot.type.name)}`}
              >
                {slot.type.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StatRow({ label, leftValue, rightValue, animate }: StatRowProps) {
  const leftPercent = Math.min((leftValue / MAX_BAR_VALUE) * 100, 100);
  const rightPercent = Math.min((rightValue / MAX_BAR_VALUE) * 100, 100);
  const leftWins = leftValue > rightValue;
  const rightWins = rightValue > leftValue;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-xs font-semibold text-slate-400">
          {leftValue} vs {rightValue}
        </p>
      </div>

      <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${leftWins ? 'bg-emerald-500' : 'bg-sky'}`}
              style={{ width: `${animate ? leftPercent : 0}%` }}
            />
          </div>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            leftWins
              ? 'bg-emerald-100 text-emerald-700'
              : rightWins
                ? 'bg-rose-100 text-rose-700'
                : 'bg-slate-100 text-slate-600'
          }`}
        >
          {leftWins ? 'A' : rightWins ? 'B' : 'EMPATE'}
        </div>

        <div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className={`ml-auto h-2 rounded-full transition-all duration-700 ${rightWins ? 'bg-emerald-500' : 'bg-sky'}`}
              style={{ width: `${animate ? rightPercent : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompareFeature() {
  const [pokemonOptions, setPokemonOptions] = useState<string[]>([]);
  const [leftNameInput, setLeftNameInput] = useState('pikachu');
  const [rightNameInput, setRightNameInput] = useState('charizard');
  const [leftPokemon, setLeftPokemon] = useState<Pokemon | null>(null);
  const [rightPokemon, setRightPokemon] = useState<Pokemon | null>(null);
  const [leftError, setLeftError] = useState<string | null>(null);
  const [rightError, setRightError] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [animateBars, setAnimateBars] = useState(false);

  const setPokemonInCache = usePokemonCacheStore((state) => state.setPokemon);

  useEffect(() => {
    let cancelled = false;

    async function loadPokemonOptions() {
      try {
        setLoadingOptions(true);
        const firstPage = await getPokemonList(1, 0);
        const list = await getPokemonList(firstPage.count, 0);

        if (cancelled) {
          return;
        }

        setPokemonOptions(list.results.map((item) => item.name));
      } catch {
        if (!cancelled) {
          setPokemonOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    }

    void loadPokemonOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  async function resolvePokemon(name: string): Promise<Pokemon> {
    const normalized = name.trim().toLowerCase();
    const cache = usePokemonCacheStore.getState().pokemonByName;

    if (cache[normalized]) {
      return cache[normalized];
    }

    const pokemon = await getPokemonByName(normalized);
    setPokemonInCache(pokemon);
    return pokemon;
  }

  async function comparePokemons() {
    const leftName = leftNameInput.trim().toLowerCase();
    const rightName = rightNameInput.trim().toLowerCase();

    if (!leftName || !rightName) {
      setLeftError(!leftName ? 'Selecciona un Pokemon.' : null);
      setRightError(!rightName ? 'Selecciona un Pokemon.' : null);
      return;
    }

    setLoadingComparison(true);
    setAnimateBars(false);
    setLeftError(null);
    setRightError(null);

    const [leftResult, rightResult] = await Promise.allSettled([
      resolvePokemon(leftName),
      resolvePokemon(rightName),
    ]);

    if (leftResult.status === 'fulfilled') {
      setLeftPokemon(leftResult.value);
    } else {
      setLeftPokemon(null);
      setLeftError('No se pudo cargar ese Pokemon.');
    }

    if (rightResult.status === 'fulfilled') {
      setRightPokemon(rightResult.value);
    } else {
      setRightPokemon(null);
      setRightError('No se pudo cargar ese Pokemon.');
    }

    setLoadingComparison(false);
    window.requestAnimationFrame(() => {
      setAnimateBars(true);
    });
  }

  const rows = useMemo(() => {
    if (!leftPokemon || !rightPokemon) {
      return [];
    }

    return COMPARED_STATS.map((stat) => ({
      key: stat.key,
      label: stat.label,
      leftValue: getStatValue(leftPokemon, stat.key),
      rightValue: getStatValue(rightPokemon, stat.key),
    }));
  }, [leftPokemon, rightPokemon]);

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-rose-100 dark:bg-rose-900/35" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-sky/10 dark:bg-sky-900/30" />
        <div className="relative">
          <p className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Compare
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">Pokemon Battle Stats</h1>
          <p className="mt-2 text-sm text-slate-600">
            Elige dos Pokemon y compara sus stats clave con una vista lado a lado.
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <CompareCard
          label="Pokemon A"
          name={leftNameInput}
          onNameChange={setLeftNameInput}
          pokemon={leftPokemon}
          loading={loadingComparison}
          error={leftError}
          options={pokemonOptions}
        />

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink text-lg font-extrabold tracking-wide text-white shadow-lg">
          VS
        </div>

        <CompareCard
          label="Pokemon B"
          name={rightNameInput}
          onNameChange={setRightNameInput}
          pokemon={rightPokemon}
          loading={loadingComparison}
          error={rightError}
          options={pokemonOptions}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void comparePokemons()} disabled={loadingComparison}>
          {loadingComparison ? 'Comparando...' : 'Comparar ahora'}
        </Button>
        {loadingOptions ? (
          <p className="text-xs font-semibold text-slate-500">Cargando opciones...</p>
        ) : null}
      </div>

      <section className="space-y-3">
        {rows.map((row) => (
          <StatRow
            key={row.key}
            label={row.label}
            leftValue={row.leftValue}
            rightValue={row.rightValue}
            animate={animateBars}
          />
        ))}
        {!loadingComparison && rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm font-medium text-slate-500">
            Selecciona dos Pokemon y presiona Comparar ahora.
          </div>
        ) : null}
      </section>
    </section>
  );
}
