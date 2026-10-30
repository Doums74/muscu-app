import { blocTermine, estPrincipale, prochainType, semaineDuBloc } from '../../src/domaine/rotation';
import { s } from '../aides';

const n = (k: number, blocId = 'b1') => Array.from({ length: k }, () => s('A', blocId));

test('estPrincipale', () => {
  expect(['A', 'B', 'C', 'D'].map(t => estPrincipale(t as never))).toEqual([true, true, true, false]);
});

test('prochainType : A au depart', () => expect(prochainType([], 'b1')).toBe('A'));
test('prochainType : la seance D est ignoree', () => expect(prochainType([s('A'), s('D')], 'b1')).toBe('B'));
test('prochainType : C -> A', () => expect(prochainType([s('C')], 'b1')).toBe('A'));
test('prochainType : un autre bloc est ignore', () => expect(prochainType([s('B', 'b0')], 'b1')).toBe('A'));

test('semaineDuBloc', () => {
  expect(semaineDuBloc([], 'b1')).toBe(1);
  expect(semaineDuBloc(n(2), 'b1')).toBe(1);
  expect(semaineDuBloc(n(3), 'b1')).toBe(2);
  expect(semaineDuBloc(n(15), 'b1')).toBe(6);
  expect(semaineDuBloc([...n(15, 'b0'), s('D')], 'b1')).toBe(1);
});

test('blocTermine', () => {
  expect(blocTermine(n(17), 'b1')).toBe(false);
  expect(blocTermine(n(18), 'b1')).toBe(true);
});
