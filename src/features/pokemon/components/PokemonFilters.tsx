type PokemonFiltersProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

function formatTypeLabel(type: string) {
  return type === 'all' ? 'Todos los tipos' : type;
}

export function PokemonFilters({ value, onChange, options }: PokemonFiltersProps) {
  return (
    <div>
      <label
        htmlFor="pokemon-type-filter"
        className="mb-1 block text-xs font-semibold uppercase text-slate-500"
      >
        Tipo
      </label>
      <select
        id="pokemon-type-filter"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pokemon-type-select w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm capitalize text-ink outline-none transition focus:border-sky focus:ring-4 focus:ring-sky/20"
      >
        {options.map((type) => (
          <option key={type} value={type} className="capitalize">
            {formatTypeLabel(type)}
          </option>
        ))}
      </select>
    </div>
  );
}
