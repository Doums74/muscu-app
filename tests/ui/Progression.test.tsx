import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { Historique } from '../../src/ui/Historique';
import { Progression } from '../../src/ui/Progression';
import type { ExerciceProgramme, Programme } from '../../src/domaine/types';
import { realisee } from '../aides';

afterEach(cleanup);

const ep = (exerciceId: string): ExerciceProgramme => ({ exerciceId, series: 3, repsMin: 6, repsMax: 8, chargeDepart: 30, repos: 150 });
const programme: Programme = {
  blocId: 'b1', debut: '2026-11-02',
  seances: { A: [ep('saut-boite'), ep('squat-barre')], B: [ep('hip-thrust')], C: [ep('squat-barre')], D: [ep('planche')] },
};
const serie = (charge: number) => ({ reps: 8, charge, difficulte: 'correct' as const });

test('un svg par exercice principal ayant des donnees', () => {
  const h = [realisee('squat-barre', [serie(40)]), realisee('squat-barre', [serie(42.5)]), realisee('saut-boite', [serie(0)])];
  const { container } = render(<Progression programme={programme} historique={h} onRetour={() => {}} />);
  expect(container.querySelectorAll('svg')).toHaveLength(1);
  expect(screen.getByText('Squat à la barre')).toBeTruthy();
  expect(screen.getByText('40 → 42.5 kg')).toBeTruthy();
});

test('message vide sans donnees', () => {
  render(<Progression programme={programme} historique={[]} onRetour={() => {}} />);
  expect(screen.getByText('Pas encore de données')).toBeTruthy();
});

test('historique : plus recente en haut, details des series', () => {
  const a = realisee('squat-barre', [serie(40)], 'b1', 'A');
  const b = realisee('hip-thrust', [serie(50)], 'b1', 'B');
  const { container } = render(<Historique historique={[a, b]} onRetour={() => {}} />);
  const titres = [...container.querySelectorAll('summary')].map(e => e.textContent);
  expect(titres[0]).toContain('Séance B');
  expect(titres[1]).toContain('Séance A');
  fireEvent.click(screen.getByText(/Séance B/));
  expect(screen.getByText('8 × 50 kg')).toBeTruthy();
});

test('historique vide', () => {
  render(<Historique historique={[]} onRetour={() => {}} />);
  expect(screen.getByText('Aucune séance pour l\'instant')).toBeTruthy();
});
