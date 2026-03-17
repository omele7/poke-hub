import type { PokemonAbility } from '@/types/pokemon';

type PokemonAbilitiesProps = {
  abilities: PokemonAbility[];
};

export function PokemonAbilities({ abilities }: PokemonAbilitiesProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Habilidades
      </h2>
      <div className="flex flex-wrap gap-2">
        {abilities.map((ability) => (
          <span
            key={ability.ability.name}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold capitalize text-slate-700"
          >
            {ability.ability.name}
            {ability.is_hidden ? ' (oculta)' : ''}
          </span>
        ))}
      </div>
    </section>
  );
}
