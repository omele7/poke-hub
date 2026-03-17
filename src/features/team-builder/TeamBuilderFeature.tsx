import { Button } from '@/components/ui/Button';
import type { Pokemon } from '@/types/pokemon';
import { getPokemonArtwork, getTypeBadgeClass } from '@/features/pokemon/utils/pokemonUi';
import { useRandomTeamBuilder } from '@/features/team-builder/hooks/useRandomTeamBuilder';

type TeamPokemonCardProps = {
  pokemon: Pokemon;
};

function getStatValue(pokemon: Pokemon, statName: string): number {
  return pokemon.stats.find((entry) => entry.stat.name === statName)?.base_stat ?? 0;
}

function TeamPokemonCard({ pokemon }: TeamPokemonCardProps) {
  const hp = getStatValue(pokemon, 'hp');
  const attack = getStatValue(pokemon, 'attack');
  const defense = getStatValue(pokemon, 'defense');
  const speed = getStatValue(pokemon, 'speed');

  const rows = [
    { label: 'HP', value: hp },
    { label: 'ATK', value: attack },
    { label: 'DEF', value: defense },
    { label: 'SPD', value: speed },
  ];

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-slate-400">
        #{pokemon.id.toString().padStart(3, '0')}
      </p>
      <img
        src={getPokemonArtwork(pokemon)}
        alt={pokemon.name}
        className="mx-auto mt-2 h-24 w-24 object-contain"
        loading="lazy"
      />

      <h3 className="mt-2 text-center text-lg font-bold capitalize text-ink">{pokemon.name}</h3>

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {pokemon.types.map((slot) => (
          <span
            key={slot.type.name}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getTypeBadgeClass(slot.type.name)}`}
          >
            {slot.type.name}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((row) => {
          const percent = Math.min((row.value / 200) * 100, 100);
          return (
            <div key={row.label} className="grid grid-cols-[34px_1fr_30px] items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">{row.label}</span>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-sky transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-right text-[11px] font-semibold text-slate-600">
                {row.value}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function TeamBuilderFeature() {
  const { team, loading, error, weaknessWarning, weaknesses, generateRandomTeam } =
    useRandomTeamBuilder();

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-100 dark:bg-emerald-900/35" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-amber/10 dark:bg-amber-900/25" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Team Builder
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">Random Pokemon Team</h1>
            <p className="mt-2 text-sm text-slate-600">
              Genera un equipo aleatorio de 6 Pokemon y analiza sus debilidades.
            </p>
          </div>

          <Button onClick={() => void generateRandomTeam()} disabled={loading}>
            {loading ? 'Generando...' : 'Generate New Team'}
          </Button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {weaknessWarning ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          {weaknessWarning}
        </div>
      ) : null}

      {team.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((pokemon) => (
            <TeamPokemonCard key={pokemon.id} pokemon={pokemon} />
          ))}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Team weaknesses
        </h2>

        {weaknesses.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No hay datos suficientes para calcular debilidades.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {weaknesses.map((row) => (
              <div
                key={row.type}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <span
                  className={`rounded-full px-2 py-0.5 capitalize ${getTypeBadgeClass(row.type)}`}
                >
                  {row.type}
                </span>
                <span className="ml-2">{row.weakMembers}/6 debiles</span>
                <span className="ml-2 text-slate-500">x{row.averageMultiplier.toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
