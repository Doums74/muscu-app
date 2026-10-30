import { ajusterApresSerie, appliquerDouleurDos } from '../../src/domaine/ajustements';
import type { SeancePrevue } from '../../src/domaine/types';
import { prevuDe, realisee } from '../aides';

const seance = (): SeancePrevue => ({
  id: '2026-11-02-A', type: 'A', blocId: 'b1', semaine: 2, source: 'claude', genereeLe: '',
  exercices: [prevuDe('squat-barre', 40), prevuDe('developpe-couche-halteres', 16)],
});

test('douleur dos remplace squat-barre par goblet-squat', () => {
  const r = appliquerDouleurDos(seance(), []);
  const ex = r.exercices[0];
  expect(ex.exerciceId).toBe('goblet-squat');
  expect(ex.remplace).toBe('squat-barre');
  expect(ex.series).toEqual([{ reps: 8, charge: 0 }, { reps: 8, charge: 0 }, { reps: 8, charge: 0 }]);
  expect(ex.repos).toBe(150);
});

test('douleur dos reprend la derniere charge du remplacant', () => {
  const h = [realisee('goblet-squat', [{ reps: 8, charge: 16, difficulte: 'correct' }, { reps: 8, charge: 18, difficulte: 'dur' }])];
  expect(appliquerDouleurDos(seance(), h).exercices[0].series[0].charge).toBe(18);
});

test('douleur dos garde les exercices sans risque', () => {
  const r = appliquerDouleurDos(seance(), []);
  expect(r.exercices[1]).toEqual(seance().exercices[1]);
});

test('serie dure non finie baisse les series suivantes', () => {
  const ex = prevuDe('squat-barre', 40);
  const r = ajusterApresSerie(ex, 0, { reps: 6, charge: 40, difficulte: 'dur' });
  expect(r.series.map(s => s.charge)).toEqual([40, 37.5, 37.5]);
});

test('serie dure mais finie -> inchange', () => {
  const ex = prevuDe('squat-barre', 40);
  expect(ajusterApresSerie(ex, 0, { reps: 8, charge: 40, difficulte: 'dur' })).toBe(ex);
});

test('serie correcte non finie -> inchange', () => {
  const ex = prevuDe('squat-barre', 40);
  expect(ajusterApresSerie(ex, 0, { reps: 6, charge: 40, difficulte: 'correct' })).toBe(ex);
});

test('baisse d\'au moins un increment', () => {
  const ex = prevuDe('goblet-squat', 10);
  expect(ajusterApresSerie(ex, 1, { reps: 5, charge: 10, difficulte: 'dur' }).series.map(s => s.charge)).toEqual([10, 10, 8]);
});

test('jamais sous zero, et poids du corps inchange', () => {
  expect(ajusterApresSerie(prevuDe('goblet-squat', 1), 0, { reps: 2, charge: 1, difficulte: 'dur' }).series[2].charge).toBe(0);
  const bd = prevuDe('bird-dog', 0);
  expect(ajusterApresSerie(bd, 0, { reps: 2, charge: 0, difficulte: 'dur' })).toBe(bd);
});

test('se base sur la charge reellement utilisee', () => {
  const r = ajusterApresSerie(prevuDe('squat-barre', 40), 0, { reps: 5, charge: 45, difficulte: 'dur' });
  expect(r.series[1].charge).toBe(42.5);
});
