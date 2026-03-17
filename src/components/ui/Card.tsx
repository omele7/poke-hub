import type { ReactNode } from 'react';

type CardProps = {
  title: string;
  children: ReactNode;
};

export function Card({ title, children }: CardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur transition-colors dark:border-slate-700 dark:bg-slate-900/85">
      <h2 className="mb-4 text-lg font-semibold text-ink dark:text-slate-100">{title}</h2>
      {children}
    </section>
  );
}
