import { create } from 'zustand';

type AppState = {
  favoritePokemon: string[];
  toggleFavorite: (name: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  favoritePokemon: [],
  toggleFavorite: (name) =>
    set((state) => {
      const normalized = name.toLowerCase();
      const exists = state.favoritePokemon.includes(normalized);
      return {
        favoritePokemon: exists
          ? state.favoritePokemon.filter((item) => item !== normalized)
          : [...state.favoritePokemon, normalized],
      };
    }),
}));
