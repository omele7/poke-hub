export type NamedApiResource = {
  name: string;
  url: string;
};

export type PokemonAbility = {
  ability: NamedApiResource;
  is_hidden: boolean;
  slot: number;
};

export type PokemonTypeSlot = {
  slot: number;
  type: NamedApiResource;
};

export type PokemonStat = {
  base_stat: number;
  effort: number;
  stat: NamedApiResource;
};

export type PokemonMove = {
  move: NamedApiResource;
};

export type PokemonListItem = NamedApiResource;

export type PokemonListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
};

export type Pokemon = {
  id: number;
  name: string;
  height: number;
  weight: number;
  species: NamedApiResource;
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: {
        front_default: string | null;
      };
    };
  };
  abilities: PokemonAbility[];
  types: PokemonTypeSlot[];
  stats: PokemonStat[];
  moves: PokemonMove[];
};

export type PokemonSpecies = {
  id: number;
  name: string;
  evolution_chain: {
    url: string;
  };
  varieties: Array<{
    is_default: boolean;
    pokemon: NamedApiResource;
  }>;
};

export type EvolutionChainLink = {
  species: NamedApiResource;
  evolves_to: EvolutionChainLink[];
};

export type EvolutionChain = {
  id: number;
  chain: EvolutionChainLink;
};

export type PokemonTypeEntry = {
  slot: number;
  pokemon: NamedApiResource;
};

export type TypeDamageRelations = {
  no_damage_to: NamedApiResource[];
  half_damage_to: NamedApiResource[];
  double_damage_to: NamedApiResource[];
  no_damage_from: NamedApiResource[];
  half_damage_from: NamedApiResource[];
  double_damage_from: NamedApiResource[];
};

export type PokemonTypeResponse = {
  id: number;
  name: string;
  damage_relations: TypeDamageRelations;
  pokemon: PokemonTypeEntry[];
};
