import { courbe, exercicesPrincipaux, regulariteSemaine } from '../../src/domaine/stats';
import type { ExerciceProgramme, Programme, SeanceRealisee, TypeSeance } from '../../src/domaine/types';
import { realisee, s } from '../aides';

const le = (type: TypeSeance, d: Date): SeanceRealisee => ({ ...s(type), date: d.toISOString() });

// Mercredi 4 novembre 2026, heure locale ; la semaine va du lundi 2 au dimanche 8.
const mercredi = new Date(2026, 10, 4, 12);

test('compte les seances principales de la semaine en cours', () => {
  const h = [le('A', new Date(2026, 10, 2, 7)), le('B', new Date(2026, 10, 4, 9)), le('D', new Date(2026, 10, 3, 18))];
  expect(regulariteSemaine(h, mercredi)).toEqual({ faites: 2, objectif: 3 });
});

test('le dimanche soir compte, le dimanche precedent non', () => {
  const h = [le('A', new Date(2026, 10, 8, 23, 30)), le('B', new Date(2026, 10, 1, 23, 30))];
  expect(regulariteSemaine(h, mercredi).faites).toBe(1);
});

test('le lundi suivant remet a zero', () => {
  const h = [le('A', new Date(2026, 10, 2, 7)), le('B', new Date(2026, 10, 4, 9))];
  expect(regulariteSemaine(h, new Date(2026, 10, 9, 8)).faites).toBe(0);
});

test('courbe : charge max par seance, ordre chronologique, autres exercices ignores', () => {
  const a = realisee('squat-barre', [{ reps: 8, charge: 40, difficulte: 'correct' }, { reps: 8, charge: 42.5, difficulte: 'dur' }]);
  const b = realisee('bird-dog', [{ reps: 8, charge: 0, difficulte: 'correct' }]);
  const c = realisee('squat-barre', [{ reps: 8, charge: 45, difficulte: 'correct' }]);
  expect(courbe([c, b, a], 'squat-barre')).toEqual([{ date: a.date, charge: 42.5 }, { date: c.date, charge: 45 }]);
});

test('exercicesPrincipaux : ids distincts du bloc force de A, B, C', () => {
  const ep = (exerciceId: string): ExerciceProgramme => ({ exerciceId, series: 3, repsMin: 6, repsMax: 8, chargeDepart: 10, repos: 150 });
  const p: Programme = {
    blocId: 'b1', debut: '2026-11-02',
    seances: {
      A: [ep('saut-boite'), ep('squat-barre'), ep('rowing-barre')],
      B: [ep('squat-barre'), ep('developpe-couche-halteres')],
      C: [ep('hip-thrust'), ep('fente-arriere')],
      D: [ep('presse-cuisses')],
    },
  };
  expect(exercicesPrincipaux(p)).toEqual(['squat-barre', 'rowing-barre', 'developpe-couche-halteres', 'hip-thrust']);
});
