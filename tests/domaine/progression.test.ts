import { choisirSeance, genererSeanceLocale } from '../../src/domaine/progression';
import type { ExerciceProgramme, Programme, SeancePrevue, SerieRealisee } from '../../src/domaine/types';
import { realisee, s } from '../aides';

const maintenant = new Date(2026, 10, 2, 18, 0); // 2 novembre 2026, heure locale

const ep = (exerciceId: string, chargeDepart: number, repos = 150, repsMin = 6, repsMax = 8): ExerciceProgramme =>
  ({ exerciceId, series: 3, repsMin, repsMax, chargeDepart, repos });

function programme(): Programme {
  const base = [ep('squat-barre', 30), ep('bird-dog', 0, 50, 6, 10), ep('planche', 0, 50, 20, 40)];
  return { blocId: 'b1', debut: '2026-11-02', seances: { A: base, B: base, C: base, D: [ep('planche', 0, 50, 20, 40)] } };
}
const serie = (reps: number, charge: number, difficulte: SerieRealisee['difficulte'] = 'correct'): SerieRealisee => ({ reps, charge, difficulte });
const squat = (seance: SeancePrevue) => seance.exercices.find(e => e.exerciceId === 'squat-barre')!;

test('premiere fois -> charge de depart, cible repsMax', () => {
  const r = genererSeanceLocale(programme(), [], 'A', maintenant);
  expect(r).toMatchObject({ id: '2026-11-02-A', type: 'A', blocId: 'b1', semaine: 1, source: 'locale' });
  expect(squat(r).series).toEqual([{ reps: 8, charge: 30 }, { reps: 8, charge: 30 }, { reps: 8, charge: 30 }]);
  expect(squat(r).repos).toBe(150);
});

test('toutes les reps au max -> +1 increment', () => {
  const h = [realisee('squat-barre', [serie(8, 40), serie(8, 40), serie(8, 40)])];
  expect(squat(genererSeanceLocale(programme(), h, 'B', maintenant)).series[0].charge).toBe(42.5);
});

test('pas toutes les reps -> meme charge', () => {
  const h = [realisee('squat-barre', [serie(8, 40), serie(8, 40), serie(7, 40)])];
  expect(squat(genererSeanceLocale(programme(), h, 'B', maintenant)).series[0].charge).toBe(40);
});

test('series manquantes -> meme charge', () => {
  const h = [realisee('squat-barre', [serie(8, 40), serie(8, 40)])];
  h[0].exercices[0].prevu.series.push({ reps: 8, charge: 40 });
  expect(squat(genererSeanceLocale(programme(), h, 'B', maintenant)).series[0].charge).toBe(40);
});

test('deux echecs de suite -> -10 %', () => {
  const h = [
    realisee('squat-barre', [serie(8, 40), serie(5, 40, 'dur'), serie(6, 40)]),
    realisee('squat-barre', [serie(8, 40), serie(4, 40, 'dur'), serie(6, 40)]),
  ];
  expect(squat(genererSeanceLocale(programme(), h, 'C', maintenant)).series[0].charge).toBe(35);
});

test('un seul echec -> meme charge', () => {
  const h = [
    realisee('squat-barre', [serie(7, 40), serie(7, 40), serie(7, 40)]),
    realisee('squat-barre', [serie(8, 40), serie(4, 40, 'dur'), serie(6, 40)]),
  ];
  expect(squat(genererSeanceLocale(programme(), h, 'C', maintenant)).series[0].charge).toBe(40);
});

test('poids du corps -> +1 rep', () => {
  const h = [realisee('bird-dog', [serie(8, 0), serie(9, 0), serie(7, 0)])];
  const ex = genererSeanceLocale(programme(), h, 'B', maintenant).exercices.find(e => e.exerciceId === 'bird-dog')!;
  expect(ex.series).toEqual([{ reps: 10, charge: 0 }, { reps: 10, charge: 0 }, { reps: 10, charge: 0 }]);
});

test('gainage en secondes -> +5 s', () => {
  const h = [realisee('planche', [serie(30, 0), serie(25, 0), serie(20, 0)])];
  const ex = genererSeanceLocale(programme(), h, 'B', maintenant).exercices.find(e => e.exerciceId === 'planche')!;
  expect(ex.series[0]).toEqual({ reps: 35, charge: 0 });
});

test('semaine 6 -> une serie de moins et 90 %', () => {
  const h = [...Array.from({ length: 14 }, () => s('A')), realisee('squat-barre', [serie(8, 40), serie(8, 40), serie(8, 40)])];
  const r = genererSeanceLocale(programme(), h, 'C', maintenant);
  expect(r.semaine).toBe(6);
  expect(squat(r).series).toEqual([{ reps: 8, charge: 35 }, { reps: 8, charge: 35 }]);
});

// --- choisirSeance ---

const preparee = (over: Partial<SeancePrevue> = {}): SeancePrevue => ({
  id: '2026-11-02-A', type: 'A', blocId: 'b1', semaine: 1, source: 'claude', genereeLe: '2026-11-01',
  exercices: [{ exerciceId: 'goblet-squat', series: [{ reps: 8, charge: 12 }], repsMin: 6, repsMax: 8, repos: 150 }],
  ...over,
});

test('utilise la seance preparee valide', () => {
  const r = choisirSeance(programme(), preparee(), [], maintenant);
  expect(r.seance.source).toBe('claude');
  expect(r.seance.exercices[0].exerciceId).toBe('goblet-squat');
});

test('ignore une seance preparee deja realisee ou d\'un autre bloc', () => {
  const faite = { ...s('A'), id: '2026-11-02-A' };
  expect(choisirSeance(programme(), preparee(), [faite], maintenant).seance.source).toBe('locale');
  expect(choisirSeance(programme(), preparee({ blocId: 'b0' }), [], maintenant).seance.source).toBe('locale');
});

test('seance preparee invalide -> locale avec avertissement', () => {
  const r = choisirSeance(programme(), { ...preparee(), exercices: [] } as SeancePrevue, [], maintenant);
  expect(r.seance.source).toBe('locale');
  expect(r.avertissements.length).toBeGreaterThan(0);
});

test('sans seance preparee -> locale du type suivant', () => {
  const r = choisirSeance(programme(), null, [s('A')], maintenant);
  expect(r.seance).toMatchObject({ source: 'locale', type: 'B' });
});
