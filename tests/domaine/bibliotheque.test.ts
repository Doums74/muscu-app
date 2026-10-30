import { BIBLIOTHEQUE, trouverExercice } from '../../src/domaine/bibliotheque';

test('ids uniques', () => {
  expect(new Set(BIBLIOTHEQUE.map(e => e.id)).size).toBe(BIBLIOTHEQUE.length);
});

test('au moins 6 exercices par bloc', () => {
  for (const b of ['explosivite', 'force', 'unilateral', 'gainage'])
    expect(BIBLIOTHEQUE.filter(e => e.bloc === b).length).toBeGreaterThanOrEqual(6);
});

test('chaque exercice a risque pour le dos a un remplacement existant, sans risque, du meme bloc', () => {
  for (const e of BIBLIOTHEQUE.filter(e => e.risqueDos)) {
    const r = trouverExercice(e.remplacementDos!);
    expect(r, e.id).toBeDefined();
    expect(r!.risqueDos).toBe(false);
    expect(r!.bloc).toBe(e.bloc);
  }
});

test('video = recherche YouTube', () => {
  for (const e of BIBLIOTHEQUE)
    expect(e.video).toMatch(/^https:\/\/www\.youtube\.com\/results\?search_query=/);
});

test('gainage du bas du dos present', () => {
  for (const id of ['bird-dog', 'extension-lombaire', 'mcgill-curl-up', 'pallof-press'])
    expect(trouverExercice(id)?.bloc).toBe('gainage');
});

test('trouverExercice renvoie undefined pour un id inconnu', () => {
  expect(trouverExercice('inexistant')).toBeUndefined();
});
