import { apiClient } from '@/services/api/client';
import { handleApiError } from '@/services/api/errors';
import type {
  EvolutionChain,
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
  PokemonTypeResponse,
} from '@/types/pokemon';

export async function getPokemonList(limit = 20, offset = 0): Promise<PokemonListResponse> {
  try {
    const response = await apiClient.get<PokemonListResponse>('/pokemon', {
      params: { limit, offset },
    });

    return response.data;
  } catch (error) {
    return handleApiError(error, 'No se pudo obtener la lista de pokemon.');
  }
}

export async function getPokemonByName(name: string): Promise<Pokemon> {
  try {
    const response = await apiClient.get<Pokemon>(`/pokemon/${name.toLowerCase()}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `No se pudo obtener el pokemon ${name}.`);
  }
}

export async function getPokemonSpecies(name: string): Promise<PokemonSpecies> {
  try {
    const response = await apiClient.get<PokemonSpecies>(`/pokemon-species/${name.toLowerCase()}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `No se pudo obtener la especie de ${name}.`);
  }
}

export async function getEvolutionChain(url: string): Promise<EvolutionChain> {
  try {
    const normalizedUrl = url.replace('http://', 'https://');
    const response = await apiClient.get<EvolutionChain>(normalizedUrl, {
      baseURL: undefined,
    });

    return response.data;
  } catch (error) {
    return handleApiError(error, 'No se pudo obtener la cadena evolutiva.');
  }
}

export async function getPokemonType(type: string): Promise<PokemonTypeResponse> {
  try {
    const response = await apiClient.get<PokemonTypeResponse>(`/type/${type.toLowerCase()}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `No se pudo obtener el tipo ${type}.`);
  }
}
