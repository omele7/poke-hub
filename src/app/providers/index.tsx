import { AppRouter } from '@/app/router';
import { AppErrorBoundary } from '@/components/system/AppErrorBoundary';

export function AppProviders() {
  return (
    <AppErrorBoundary>
      <AppRouter />
    </AppErrorBoundary>
  );
}
