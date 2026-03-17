import { AppShell } from '@/components/layout/AppShell';
import { PokemonFeature } from '@/features/pokemon/PokemonFeature';

export function HomePage() {
  return (
    <AppShell>
      <PokemonFeature />
    </AppShell>
  );
}
