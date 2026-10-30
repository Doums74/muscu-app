import { arrondiInf, arrondiProche, augmentationMax, derniereFois } from '../../src/domaine/calcul';
import { realisee, s } from '../aides';

test('augmentationMax : au moins un increment', () => expect(augmentationMax(40, 2.5)).toBe(2.5));
test('augmentationMax : 5 % arrondi a l\'increment', () => expect(augmentationMax(100, 2.5)).toBe(5));
test('augmentationMax : poids du corps -> 0', () => expect(augmentationMax(0, 0)).toBe(0));

test('arrondiProche', () => expect(arrondiProche(36.8, 2.5)).toBe(37.5));
test('arrondiInf', () => expect(arrondiInf(36.8, 2.5)).toBe(35));
test('arrondi sans increment renvoie la valeur', () => {
  expect(arrondiInf(7.3, 0)).toBe(7.3);
  expect(arrondiProche(7.3, 0)).toBe(7.3);
});
test('arrondiInf tolere les erreurs de flottant', () => expect(arrondiInf(0.3 * 3 * 10, 0.5)).toBe(9));

test('derniereFois : plus recente d\'abord, limitee a n', () => {
  const h = [
    realisee('squat-barre', [{ reps: 8, charge: 40, difficulte: 'correct' }]),
    s('B'),
    realisee('squat-barre', [{ reps: 8, charge: 42.5, difficulte: 'correct' }]),
  ];
  const r = derniereFois(h, 'squat-barre', 2);
  expect(r.map(x => x.series[0].charge)).toEqual([42.5, 40]);
  expect(derniereFois(h, 'squat-barre')).toHaveLength(1);
  expect(derniereFois(h, 'bird-dog')).toEqual([]);
});
