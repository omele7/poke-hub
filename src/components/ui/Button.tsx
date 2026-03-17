import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-xl bg-sky px-4 py-2 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky/20 disabled:cursor-not-allowed disabled:opacity-70 dark:focus-visible:ring-sky/30',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
