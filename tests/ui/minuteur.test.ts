import { creerMinuteur } from '../../src/ui/minuteur';

test('minuteur base sur l\'horloge reelle', () => {
  let t = 0;
  const m = creerMinuteur(90, () => t);
  expect(m.restant()).toBe(90);
  expect(m.fini()).toBe(false);
  t = 30_000;
  expect(m.restant()).toBe(60);
  t = 200_000; // écran verrouillé longtemps : le repos est fini, pas négatif
  expect(m.restant()).toBe(0);
  expect(m.fini()).toBe(true);
});

test('minuteur arrondit a la seconde superieure', () => {
  let t = 0;
  const m = creerMinuteur(10, () => t);
  t = 9_100;
  expect(m.restant()).toBe(1);
});

test('minuteur peut repartir d\'une fin connue', () => {
  let t = 5_000;
  const m = creerMinuteur({ fin: 65_000 }, () => t);
  expect(m.restant()).toBe(60);
  expect(m.fin).toBe(65_000);
});
