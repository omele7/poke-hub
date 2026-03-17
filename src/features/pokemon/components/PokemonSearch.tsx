type PokemonSearchProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  loadingOptions?: boolean;
};

export function PokemonSearch({
  value,
  onChange,
  options,
  loadingOptions = false,
}: PokemonSearchProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Nombre</label>
      <div className="relative">
        <input
          type="text"
          list={options.length > 0 ? 'pokemon-search-options' : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Busca por nombre..."
          className="pokemon-search-input w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-ink outline-none transition focus:border-sky focus:ring-4 focus:ring-sky/20"
        />
        <datalist id="pokemon-search-options">
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        {value ? (
          <button
            type="button"
            aria-label="Limpiar busqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
            onClick={() => onChange('')}
          >
            Limpiar
          </button>
        ) : null}
      </div>
      {loadingOptions ? (
        <p className="mt-1 text-xs font-semibold text-slate-500">Cargando sugerencias...</p>
      ) : null}
    </div>
  );
}
