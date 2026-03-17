import type { PokemonMove } from '@/types/pokemon';

type PokemonMovesProps = {
  moves: PokemonMove[];
  maxVisible?: number;
};

export function PokemonMoves({ moves, maxVisible = 24 }: PokemonMovesProps) {
  const visibleMoves = moves.slice(0, maxVisible);
  const hiddenCount = moves.length - visibleMoves.length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Movimientos
        </h2>
        <span className="text-xs font-semibold text-slate-400">{moves.length} total</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleMoves.map((entry) => (
          <span
            key={entry.move.name}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold capitalize text-slate-700"
          >
            {entry.move.name}
          </span>
        ))}
      </div>

      {hiddenCount > 0 ? (
        <p className="mt-3 text-xs font-medium text-slate-500">
          y {hiddenCount} movimientos mas...
        </p>
      ) : null}
    </section>
  );
}
