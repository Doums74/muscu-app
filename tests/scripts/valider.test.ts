// @vitest-environment node
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { valider } from '../../scripts/valider';
import type { ExerciceProgramme, Programme, SeancePrevue } from '../../src/domaine/types';
import { realisee } from '../aides';

const ep = (exerciceId: string, repos: number): ExerciceProgramme => ({ exerciceId, series: 3, repsMin: 6, repsMax: 8, chargeDepart: 10, repos });
const complete = () => [ep('saut-boite', 100), ep('squat-barre', 150), ep('fente-arriere', 75), ep('bird-dog', 50)];
const programme: Programme = { blocId: 'b1', debut: '2026-11-02', seances: { A: complete(), B: complete(), C: complete(), D: [ep('rameur', 60), ep('planche', 50)] } };
const seance = (charge: number, blocId = 'b1'): SeancePrevue => ({
  id: '2026-11-04-B', type: 'B', blocId, semaine: 1, source: 'claude', genereeLe: '2026-11-03',
  exercices: [{ exerciceId: 'squat-barre', series: [{ reps: 8, charge }], repsMin: 6, repsMax: 8, repos: 150 }],
});

function dossier(fichiers: Record<string, unknown>): string {
  const d = mkdtempSync(join(tmpdir(), 'muscu-'));
  for (const [nom, contenu] of Object.entries(fichiers)) writeFileSync(join(d, nom), JSON.stringify(contenu));
  return d;
}
const lire = (d: string, nom: string) => JSON.parse(readFileSync(join(d, nom), 'utf-8'));

test('seance trop chargee -> ok, fichier reecrit avec la charge plafonnee', () => {
  const h = [realisee('squat-barre', [{ reps: 8, charge: 40, difficulte: 'correct' }])];
  const d = dossier({ 'programme.json': programme, 'historique.json': h, 'prochaine-seance.json': seance(60) });
  const r = valider(d);
  expect(r.ok).toBe(true);
  expect(r.messages.join('\n')).toContain('42.5');
  expect(lire(d, 'prochaine-seance.json').exercices[0].series[0].charge).toBe(42.5);
});

test('seance correcte -> fichier inchange', () => {
  const d = dossier({ 'programme.json': programme, 'prochaine-seance.json': seance(30) });
  const avant = readFileSync(join(d, 'prochaine-seance.json'), 'utf-8');
  expect(valider(d).ok).toBe(true);
  expect(readFileSync(join(d, 'prochaine-seance.json'), 'utf-8')).toBe(avant);
});

test('programme seul (sans seance ni historique) -> ok', () => {
  expect(valider(dossier({ 'programme.json': programme })).ok).toBe(true);
});

test('programme invalide -> ko', () => {
  const r = valider(dossier({ 'programme.json': { ...programme, seances: { ...programme.seances, A: [] } } }));
  expect(r.ok).toBe(false);
  expect(r.messages.join('\n')).toContain('Séance A');
});

test('programme absent -> ko', () => {
  expect(valider(dossier({})).ok).toBe(false);
});

test('blocId different -> ko', () => {
  const r = valider(dossier({ 'programme.json': programme, 'prochaine-seance.json': seance(30, 'b0') }));
  expect(r.ok).toBe(false);
  expect(r.messages.join('\n')).toContain('b0');
});

test('seance illisible -> ko', () => {
  expect(valider(dossier({ 'programme.json': programme, 'prochaine-seance.json': { foo: 1 } })).ok).toBe(false);
});
