import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Pokemon } from '@/types/pokemon';
import { PokemonStats } from '@/features/pokemon/components/PokemonStats';
import { getPokemonArtwork, getTypeBadgeClass } from '@/features/pokemon/utils/pokemonUi';

type PokemonDetailModalProps = {
  pokemon: Pokemon | null;
  onClose: () => void;
};

export function PokemonDetailModal({ pokemon, onClose }: PokemonDetailModalProps) {
  useEffect(() => {
    if (!pokemon) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [pokemon, onClose]);

  if (!pokemon) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400">
              #{pokemon.id.toString().padStart(3, '0')}
            </p>
            <h3 className="text-2xl font-bold capitalize text-ink">{pokemon.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/pokemon/${pokemon.name}`}
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:border-sky/30"
            >
              Ver pagina
            </Link>
            <button
              type="button"
              className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>

        <img
          src={getPokemonArtwork(pokemon)}
          alt={pokemon.name}
          className="mx-auto mt-4 h-40 w-40 object-contain"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {pokemon.types.map((slot) => (
            <span
              key={slot.type.name}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getTypeBadgeClass(slot.type.name)}`}
            >
              {slot.type.name}
            </span>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Stats base
          </h4>
          <PokemonStats stats={pokemon.stats} />
        </div>

        <div className="mt-4">
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Habilidades
          </h4>
          <div className="flex flex-wrap gap-2">
            {pokemon.abilities.map((ability) => (
              <span
                key={ability.ability.name}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium capitalize text-slate-600"
              >
                {ability.ability.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
