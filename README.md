# Pokehub

Pokehub es una SPA desarrollada con React, Vite y TypeScript para explorar informacion de Pokemon mediante PokeAPI. El proyecto combina una Pokedex principal con modulos de comparacion, quiz, rankings, favoritos y armado de equipos.

## Alcance del proyecto

- Explorar Pokemon por listado paginado, busqueda por nombre y filtro por tipo.
- Visualizar detalle completo por Pokemon (stats, habilidades, movimientos y cadena evolutiva).
- Gestionar favoritos persistidos en el navegador.
- Comparar dos Pokemon lado a lado por estadisticas base.
- Jugar quiz con temporizador en dos modos: identificar Pokemon y adivinar tipo.
- Generar equipos aleatorios de 6 Pokemon y analizar debilidades por tipo.
- Consultar rankings top 10 por metricas de combate y fisicas.

## Stack tecnologico

- React 18
- TypeScript 5
- Vite 5
- React Router DOM 6
- Zustand (estado global y persistencia)
- Axios (cliente HTTP)
- Tailwind CSS 3
- ESLint 9 + Prettier 3

## Arquitectura

El proyecto esta organizado por capas y por funcionalidad:

- app: bootstrap de la aplicacion, providers y router.
- pages: vistas asociadas a rutas.
- features: modulos funcionales (pokemon, compare, quiz, team-builder, rankings).
- components: layout, componentes base de UI y boundary de errores.
- services/api: cliente Axios, manejo de errores y funciones de acceso a PokeAPI.
- store: estado global con cache de Pokemon y favoritos persistidos.
- hooks: hooks reutilizables (debounce, countdown, tema).
- types: contratos de datos de PokeAPI.

## Decisiones tecnicas relevantes

- Cache en memoria de Pokemon y de indices por tipo para reducir llamadas repetidas.
- Persistencia de favoritos en localStorage mediante zustand/middleware persist.
- Manejo centralizado de errores HTTP con clase ApiError.
- Reintentos en flujos sensibles (quiz, team builder, rankings) para mejorar robustez.
- Tema claro/oscuro controlado por clase dark y preferencia del usuario.
- Alias de importacion @ -> /src para mantener imports consistentes.

## Rutas principales

- /: Pokedex principal
- /pokemon/:name: detalle del Pokemon
- /favorites: favoritos
- /compare: comparador
- /quiz: quiz interactivo
- /team-builder: generador de equipo
- /rankings: rankings

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Configuracion de entorno

Crear un archivo .env en la raiz del proyecto:

```env
VITE_API_BASE_URL=https://pokeapi.co/api/v2
```

Si no se define la variable, el cliente usa ese valor por defecto.

## Ejecucion local

```bash
npm install
npm run dev
```

Aplicacion disponible en la URL mostrada por Vite (por defecto http://localhost:5173).

## Scripts

- npm run dev: inicia el servidor de desarrollo.
- npm run build: compila TypeScript y genera build de produccion.
- npm run preview: sirve localmente la build generada.
- npm run lint: ejecuta reglas de lint.
- npm run format: aplica formato con Prettier.
- npm run check-format: valida formato sin modificar archivos.

## Estructura resumida

```text
src/
	app/
	components/
	features/
	hooks/
	pages/
	services/
	store/
	types/
	utils/
```

## Estado actual

Proyecto funcional orientado a frontend, sin backend propio. Toda la informacion de dominio proviene de PokeAPI y se complementa con cache local para mejorar tiempos de respuesta en la interfaz.
"# poke-hub" 
