import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PokemonDetailPage } from '@/pages/PokemonDetailPage';
import { ComparePage } from '@/pages/ComparePage';
import { TeamBuilderPage } from '@/pages/TeamBuilderPage';
import { QuizPage } from '@/pages/QuizPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { RankingsPage } from '@/pages/RankingsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/pokemon/:name',
    element: <PokemonDetailPage />,
  },
  {
    path: '/compare',
    element: <ComparePage />,
  },
  {
    path: '/team-builder',
    element: <TeamBuilderPage />,
  },
  {
    path: '/quiz',
    element: <QuizPage />,
  },
  {
    path: '/favorites',
    element: <FavoritesPage />,
  },
  {
    path: '/rankings',
    element: <RankingsPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
