import { PLAGES_REPOS, validerProgramme, validerSeance } from '../../src/domaine/gardefous';
import type { ExerciceProgramme, Programme, SeancePrevue } from '../../src/domaine/types';
import { prevuDe, realisee } from '../aides';

function seance(exercices: SeancePrevue['exercices'], semaine = 2): SeancePrevue {
  return { id: '2026-11-02-A', type: 'A', blocId: 'b1', semaine, source: 'claude', genereeLe: '2026-11-01', exercices };
}
const prevue = (id: string, charge: number, semaine = 2) => seance([prevuDe(id, charge)], semaine);

test('plages de repos', () => {
  expect(PLAGES_REPOS).toEqual({ explosivite: [90, 120], force: [120, 180], unilateral: [60, 90], gainage: [45, 60] });
});

test('plafonne une hausse de charge a +5 % ou un increment', () => {
  const h = [realisee('squat-barre', [{ reps: 8, charge: 40, difficulte: 'correct' }])];
  const r = validerSeance(prevue('squat-barre', 50), h);
  expect(r.seance!.exercices[0].series.map(x => x.charge)).toEqual([42.5, 42.5, 42.5]);
  expect(r.avertissements[0]).toContain('Squat');
});

test('une hausse raisonnable passe sans avertissement', () => {
  const h = [realisee('squat-barre', [{ reps: 8, charge: 40, difficulte: 'correct' }])];
  const r = validerSeance(prevue('squat-barre', 42.5), h);
  expect(r.seance!.exercices[0].series[0].charge).toBe(42.5);
  expect(r.avertissements).toEqual([]);
});

test('sans historique, pas de plafond (calibrage)', () => {
  expect(validerSeance(prevue('squat-barre', 30), []).seance!.exercices[0].series[0].charge).toBe(30);
});

test('retire un exercice inconnu', () => {
  const r = validerSeance(seance([prevuDe('inexistant', 10), prevuDe('goblet-squat', 12)]), []);
  expect(r.seance!.exercices.map(e => e.exerciceId)).toEqual(['goblet-squat']);
  expect(r.avertissements[0]).toContain('inexistant');
});

test('aucun exercice valide -> null', () => {
  expect(validerSeance(seance([prevuDe('inexistant', 10)]), []).seance).toBeNull();
});

test('json malforme -> null', () => {
  expect(validerSeance({ foo: 1 }, []).seance).toBeNull();
  expect(validerSeance(null, []).seance).toBeNull();
  expect(validerSeance({ ...prevue('goblet-squat', 10), exercices: [{ exerciceId: 'goblet-squat', series: 'x' }] }, []).seance).toBeNull();
});

test('repos ramene dans la plage du bloc', () => {
  const ex = { ...prevuDe('goblet-squat', 12), repos: 300 };
  const r = validerSeance(seance([ex]), []);
  expect(r.seance!.exercices[0].repos).toBe(180);
  expect(r.avertissements[0]).toContain('Goblet squat');
});

test('nombre de series limite a 6 et reps a 30', () => {
  const ex = prevuDe('goblet-squat', 12, 9, 50);
  const r = validerSeance(seance([ex]), []);
  expect(r.seance!.exercices[0].series).toHaveLength(6);
  expect(r.seance!.exercices[0].series[0].reps).toBe(30);
});

test('exercice en secondes limite a 120 s', () => {
  const ex = { ...prevuDe('planche', 0, 2, 300, 20, 40), repos: 50 };
  expect(validerSeance(seance([ex]), []).seance!.exercices[0].series[0].reps).toBe(120);
});

test('semaine 6 allege a 90 %', () => {
  const h = [realisee('squat-barre', [{ reps: 8, charge: 40, difficulte: 'correct' }])];
  const r = validerSeance(prevue('squat-barre', 40, 6), h);
  expect(r.seance!.exercices[0].series[0].charge).toBe(35);
});

test('poids du corps -> charge 0, charge negative -> 0', () => {
  const r = validerSeance(seance([{ ...prevuDe('bird-dog', 5), repos: 50 }, prevuDe('goblet-squat', -4)]), []);
  expect(r.seance!.exercices.map(e => e.series[0].charge)).toEqual([0, 0]);
});

// --- Programme ---

const ep = (exerciceId: string, repos: number, repsMin = 6, repsMax = 8): ExerciceProgramme =>
  ({ exerciceId, series: 3, repsMin, repsMax, chargeDepart: 10, repos });
const seanceComplete = () => [ep('saut-boite', 100), ep('goblet-squat', 150), ep('fente-arriere', 75), ep('bird-dog', 50)];

function programme(): Programme {
  return { blocId: 'b1', debut: '2026-11-02', seances: { A: seanceComplete(), B: seanceComplete(), C: seanceComplete(), D: [ep('planche', 50, 20, 40)] } };
}

test('programme valide', () => {
  const r = validerProgramme(programme());
  expect(r.erreurs).toEqual([]);
  expect(r.programme).not.toBeNull();
});

test('programme sans bloc gainage en A -> erreur', () => {
  const p = programme();
  p.seances.A = p.seances.A.slice(0, 3);
  const r = validerProgramme(p);
  expect(r.programme).toBeNull();
  expect(r.erreurs.join(' ')).toContain('A');
});

test('programme avec blocs dans le mauvais ordre -> erreur', () => {
  const p = programme();
  p.seances.B = [...p.seances.B].reverse();
  expect(validerProgramme(p).programme).toBeNull();
});

test('programme avec id inconnu, repos hors plage ou repsMin > repsMax -> erreurs', () => {
  const p = programme();
  p.seances.C = [ep('saut-boite', 100), ep('inexistant', 150), ep('goblet-squat', 400), ep('fente-arriere', 75, 10, 8), ep('bird-dog', 50)];
  expect(validerProgramme(p).erreurs.length).toBeGreaterThanOrEqual(3);
});

test('programme sans seance D ou D sans gainage -> erreur', () => {
  const p = programme();
  p.seances.D = [ep('goblet-squat', 150)];
  expect(validerProgramme(p).programme).toBeNull();
  expect(validerProgramme({ ...programme(), seances: { A: [], B: [], C: [] } }).programme).toBeNull();
});
