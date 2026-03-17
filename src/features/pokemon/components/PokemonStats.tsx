import { useEffect, useState } from 'react';
import type { PokemonStat } from '@/types/pokemon';

type PokemonStatsProps = {
  stats: PokemonStat[];
};

const statLabels: Record<string, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'SPD',
};

export function PokemonStats({ stats }: PokemonStatsProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setAnimated(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [stats]);

  return (
    <div className="space-y-2">
      {stats.map((entry) => {
        const rawLabel = entry.stat.name;
        const label = statLabels[rawLabel] ?? rawLabel;
        const value = entry.base_stat;
        const fillPercent = Math.min((value / 200) * 100, 100);

        return (
          <div key={rawLabel} className="grid grid-cols-[40px_1fr_36px] items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">{label}</span>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-sky transition-all duration-700"
                style={{ width: `${animated ? fillPercent : 0}%` }}
              />
            </div>
            <span className="text-right text-xs font-semibold text-slate-600">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
