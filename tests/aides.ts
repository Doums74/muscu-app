import type { ExercicePrevu, SeanceRealisee, SerieRealisee, TypeSeance } from '../src/domaine/types';

let compteur = 0;

/** Séance réalisée minimale ; les dates augmentent à chaque appel pour garder l'ordre chronologique. */
export function s(type: TypeSeance, blocId = 'b1', exercices: SeanceRealisee['exercices'] = []): SeanceRealisee {
  compteur++;
  const date = new Date(Date.UTC(2026, 0, 1) + compteur * 3_600_000).toISOString();
  return { id: `s${compteur}-${type}`, type, blocId, semaine: 1, date, douleurDos: false, exercices };
}

export function prevuDe(exerciceId: string, charge: number, nbSeries = 3, reps = 8, repsMin = 6, repsMax = 8, repos = 150): ExercicePrevu {
  return { exerciceId, series: Array.from({ length: nbSeries }, () => ({ reps, charge })), repsMin, repsMax, repos };
}

/** Séance réalisée contenant un seul exercice. */
export function realisee(exerciceId: string, series: SerieRealisee[], blocId = 'b1', type: TypeSeance = 'A'): SeanceRealisee {
  const charge = series[0]?.charge ?? 0;
  return s(type, blocId, [{ prevu: prevuDe(exerciceId, charge, series.length), series }]);
}
