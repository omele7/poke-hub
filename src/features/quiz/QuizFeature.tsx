import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCountdown } from '@/hooks/useCountdown';
import { getPokemonByName, getPokemonList } from '@/services/api/pokemonApi';
import type { Pokemon } from '@/types/pokemon';
import { getPokemonArtwork, getTypeBadgeClass } from '@/features/pokemon/utils/pokemonUi';
import { usePokemonCacheStore } from '@/store/usePokemonCacheStore';

type QuizMode = 'who-is-this' | 'guess-type';

type QuizQuestion = {
  pokemon: Pokemon;
  options: string[];
  correctAnswer: string;
};

const QUIZ_TIMER_SECONDS = 60;
const QUESTION_LIMIT = 10;
const QUIZ_POKEMON_POOL_SIZE = 493;
const QUIZ_QUESTION_RETRIES = 3;
const POKEMON_FETCH_RETRIES = 2;
const WHO_IS_THIS_BATCH_SIZE = 8;
const WHO_IS_THIS_ROUNDS = 5;
const RETRY_DELAY_MS = 180;
const TYPE_OPTIONS = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function pickRandomUniqueIds(max: number, amount: number): number[] {
  const values = new Set<number>();

  while (values.size < amount) {
    values.add(Math.floor(Math.random() * max) + 1);
  }

  return Array.from(values);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function pickRandomUniqueFromPool(pool: string[], amount: number, excluded: Set<string>): string[] {
  const selected = new Set<string>();

  for (const name of shuffleArray(pool)) {
    const normalized = name.toLowerCase();

    if (excluded.has(normalized)) {
      continue;
    }

    selected.add(normalized);
    if (selected.size >= amount) {
      break;
    }
  }

  return Array.from(selected);
}

export function QuizFeature() {
  const setPokemonsInCache = usePokemonCacheStore((state) => state.setPokemons);

  const [mode, setMode] = useState<QuizMode | null>(null);
  const [status, setStatus] = useState<'idle' | 'playing' | 'game-over'>('idle');
  const [maxPokemonCount, setMaxPokemonCount] = useState<number>(1025);
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pokemonNamePool, setPokemonNamePool] = useState<string[]>([]);

  const handleCountdownFinished = useCallback(() => {
    setStatus('game-over');
  }, []);

  const { timeLeft, resetCountdown } = useCountdown(
    QUIZ_TIMER_SECONDS,
    status === 'playing',
    handleCountdownFinished,
  );

  const activeRequestRef = useRef(0);
  const hasBootstrappedCountRef = useRef(false);

  useEffect(() => {
    if (hasBootstrappedCountRef.current) {
      return;
    }

    hasBootstrappedCountRef.current = true;

    async function loadCount() {
      try {
        const response = await getPokemonList(1, 0);
        setMaxPokemonCount(response.count);

        const poolLimit = Math.min(response.count, QUIZ_POKEMON_POOL_SIZE);
        const poolResponse = await getPokemonList(poolLimit, 0);
        setPokemonNamePool(poolResponse.results.map((item) => item.name.toLowerCase()));
      } catch {
        setMaxPokemonCount(1025);
        setPokemonNamePool([]);
      }
    }

    void loadCount();
  }, []);

  const fetchPokemonByKey = useCallback(
    async (key: string): Promise<Pokemon> => {
      const normalizedKey = key.toLowerCase();
      const cached = usePokemonCacheStore.getState().pokemonByName[normalizedKey];

      if (cached) {
        return cached;
      }

      let attempt = 0;
      let lastError: unknown;

      while (attempt <= POKEMON_FETCH_RETRIES) {
        try {
          const pokemon = await getPokemonByName(normalizedKey);
          setPokemonsInCache([pokemon]);
          return pokemon;
        } catch (fetchError) {
          lastError = fetchError;
          attempt += 1;

          if (attempt <= POKEMON_FETCH_RETRIES) {
            await delay(RETRY_DELAY_MS * attempt);
          }
        }
      }

      throw lastError;
    },
    [setPokemonsInCache],
  );

  const buildWhoIsThisQuestion = useCallback(async (): Promise<QuizQuestion> => {
    const collected = new Map<number, Pokemon>();
    const usedKeys = new Set<string>();
    let round = 0;

    while (collected.size < 4 && round < WHO_IS_THIS_ROUNDS) {
      const candidateKeys =
        pokemonNamePool.length > 0
          ? pickRandomUniqueFromPool(pokemonNamePool, WHO_IS_THIS_BATCH_SIZE, usedKeys)
          : pickRandomUniqueIds(maxPokemonCount, WHO_IS_THIS_BATCH_SIZE).map((id) => String(id));

      candidateKeys.forEach((key) => {
        usedKeys.add(key.toLowerCase());
      });

      const results = await Promise.allSettled(candidateKeys.map((key) => fetchPokemonByKey(key)));

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          collected.set(result.value.id, result.value);
        }
      });

      round += 1;
    }

    const optionsPokemons = shuffleArray(Array.from(collected.values())).slice(0, 4);

    if (optionsPokemons.length < 4) {
      throw new Error('INSUFFICIENT_POKEMON_OPTIONS');
    }

    const correctPokemon = optionsPokemons[Math.floor(Math.random() * optionsPokemons.length)];
    const options = shuffleArray(optionsPokemons.map((pokemon) => pokemon.name));

    return {
      pokemon: correctPokemon,
      options,
      correctAnswer: correctPokemon.name,
    };
  }, [fetchPokemonByKey, maxPokemonCount, pokemonNamePool]);

  const buildGuessTypeQuestion = useCallback(async (): Promise<QuizQuestion> => {
    let attempt = 0;
    let pokemon: Pokemon | null = null;

    while (!pokemon && attempt < QUIZ_QUESTION_RETRIES) {
      const key =
        pokemonNamePool.length > 0
          ? pokemonNamePool[Math.floor(Math.random() * pokemonNamePool.length)]
          : String(Math.floor(Math.random() * maxPokemonCount) + 1);

      try {
        pokemon = await fetchPokemonByKey(key);
      } catch {
        attempt += 1;
      }
    }

    if (!pokemon) {
      throw new Error('POKEMON_FETCH_FAILED');
    }

    const availableCorrectTypes = pokemon.types.map((slot) => slot.type.name.toLowerCase());
    const correctType =
      availableCorrectTypes[Math.floor(Math.random() * availableCorrectTypes.length)] ?? 'normal';

    const distractors = shuffleArray(
      TYPE_OPTIONS.filter((type) => !availableCorrectTypes.includes(type)),
    ).slice(0, 3);

    return {
      pokemon,
      options: shuffleArray([correctType, ...distractors]),
      correctAnswer: correctType,
    };
  }, [fetchPokemonByKey, maxPokemonCount, pokemonNamePool]);

  const loadQuestion = useCallback(async () => {
    if (!mode) {
      return;
    }

    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    setLoadingQuestion(true);
    setSelectedAnswer(null);
    setError(null);

    try {
      let question: QuizQuestion | null = null;
      let attempt = 0;

      while (!question && attempt <= QUIZ_QUESTION_RETRIES) {
        try {
          question =
            mode === 'who-is-this'
              ? await buildWhoIsThisQuestion()
              : await buildGuessTypeQuestion();
        } catch {
          attempt += 1;

          if (attempt <= QUIZ_QUESTION_RETRIES) {
            await delay(RETRY_DELAY_MS * attempt);
          }
        }
      }

      if (requestId !== activeRequestRef.current) {
        return;
      }

      if (!question) {
        throw new Error('QUESTION_BUILD_FAILED');
      }

      setCurrentQuestion(question);
    } catch {
      if (requestId !== activeRequestRef.current) {
        return;
      }

      setError('La API esta tardando un poco. Intentemos otra vez.');
      setCurrentQuestion(null);
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoadingQuestion(false);
      }
    }
  }, [buildGuessTypeQuestion, buildWhoIsThisQuestion, mode]);

  function startGame(selectedMode: QuizMode) {
    setMode(selectedMode);
    setStatus('playing');
    setScore(0);
    resetCountdown();
    setQuestionNumber(1);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setError(null);
  }

  useEffect(() => {
    if (status !== 'playing' || !mode) {
      return;
    }

    void loadQuestion();
  }, [loadQuestion, mode, status, questionNumber]);

  function handleAnswer(option: string) {
    if (!currentQuestion || selectedAnswer || status !== 'playing') {
      return;
    }

    setSelectedAnswer(option);

    if (option === currentQuestion.correctAnswer) {
      setScore((current) => current + 1);
    }
  }

  function goToNextQuestion() {
    if (status !== 'playing') {
      return;
    }

    if (questionNumber >= QUESTION_LIMIT || timeLeft <= 0) {
      setStatus('game-over');
      return;
    }

    setQuestionNumber((current) => current + 1);
  }

  function restartWithSameMode() {
    if (!mode) {
      return;
    }

    startGame(mode);
  }

  function resetToModeSelection() {
    setStatus('idle');
    setMode(null);
    setScore(0);
    resetCountdown();
    setQuestionNumber(1);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setError(null);
  }

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/35" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-cyan-100 dark:bg-cyan-900/35" />

        <div className="relative">
          <p className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Quiz
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
            Pokemon Quiz Mini Game
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Adivina el Pokemon o su tipo en contrarreloj.
          </p>
        </div>
      </header>

      {status === 'idle' ? (
        <section className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            onClick={() => startGame('who-is-this')}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Modo 1</p>
            <h2 className="mt-2 text-xl font-bold text-ink">Who is this Pokemon?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Imagen en silueta + 4 respuestas posibles.
            </p>
          </button>

          <button
            type="button"
            className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            onClick={() => startGame('guess-type')}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Modo 2</p>
            <h2 className="mt-2 text-xl font-bold text-ink">Guess the type</h2>
            <p className="mt-2 text-sm text-slate-600">
              Imagen real del Pokemon + 4 opciones de tipo.
            </p>
          </button>
        </section>
      ) : null}

      {status === 'playing' ? (
        <section className="space-y-4">
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</p>
              <p className="text-xl font-bold text-ink">{score}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timer</p>
              <p className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-ink'}`}>
                {timeLeft}s
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pregunta
              </p>
              <p className="text-xl font-bold text-ink">
                {questionNumber}/{QUESTION_LIMIT}
              </p>
            </div>
          </div>

          {loadingQuestion ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm">
              Cargando pregunta...
            </div>
          ) : null}

          {error ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
              <p>{error}</p>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => void loadQuestion()}
              >
                Reintentar pregunta
              </Button>
            </div>
          ) : null}

          {!loadingQuestion && !error && currentQuestion ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="rounded-2xl bg-slate-50 p-4">
                {mode === 'who-is-this' ? (
                  <>
                    <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Who is this Pokemon?
                    </p>
                    <img
                      src={getPokemonArtwork(currentQuestion.pokemon)}
                      alt="Silueta de Pokemon"
                      className="mx-auto mt-4 h-44 w-44 object-contain [filter:brightness(0)]"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Guess the type
                    </p>
                    <img
                      src={getPokemonArtwork(currentQuestion.pokemon)}
                      alt={currentQuestion.pokemon.name}
                      className="mx-auto mt-4 h-44 w-44 object-contain"
                    />
                  </>
                )}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {currentQuestion.options.map((option) => {
                  const normalizedOption = option.toLowerCase();
                  const normalizedCorrect = currentQuestion.correctAnswer.toLowerCase();
                  const isSelected = selectedAnswer?.toLowerCase() === normalizedOption;
                  const isCorrect = normalizedOption === normalizedCorrect;

                  const style = !selectedAnswer
                    ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky/30'
                    : isCorrect
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : isSelected
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-white/60 text-slate-400';

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleAnswer(option)}
                      disabled={Boolean(selectedAnswer)}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition ${style}`}
                    >
                      {mode === 'guess-type' ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ring-1 ring-black/5 dark:ring-white/10 ${getTypeBadgeClass(option)}`}
                        >
                          {option}
                        </span>
                      ) : (
                        option
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-600">
                    {selectedAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
                      ? 'Correcto!'
                      : `Incorrecto. Era ${currentQuestion.correctAnswer}.`}
                  </p>
                  <Button onClick={goToNextQuestion}>
                    {questionNumber >= QUESTION_LIMIT || timeLeft <= 0
                      ? 'Ver resultado'
                      : 'Next question'}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {status === 'game-over' ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Game Over</p>
          <h2 className="mt-2 text-3xl font-bold text-ink">Puntaje final: {score}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Respondiste {score} de {Math.min(questionNumber, QUESTION_LIMIT)} preguntas.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={restartWithSameMode}>Jugar de nuevo</Button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky/30"
              onClick={resetToModeSelection}
            >
              Cambiar modo
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );
}
