import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { Accueil } from '../../src/ui/Accueil';
import type { Etat } from '../../src/stockage/depot';
import type { ExerciceProgramme, Programme, SeancePrevue } from '../../src/domaine/types';
import { s } from '../aides';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const ep = (exerciceId: string, repos = 150): ExerciceProgramme => ({ exerciceId, series: 3, repsMin: 6, repsMax: 8, chargeDepart: 30, repos });
const programme: Programme = {
  blocId: 'b1', debut: '2026-11-02',
  seances: { A: [ep('squat-barre'), ep('bird-dog', 50)], B: [ep('goblet-squat')], C: [ep('hip-thrust')], D: [ep('planche', 50)] },
};
const etat = (over: Partial<Etat> = {}): Etat => ({ programme, prochaine: null, historique: [], horsLigne: false, erreur: null, ...over });
const maintenant = new Date(2026, 10, 4, 12);
const actions = () => ({ onCommencer: vi.fn(), onReprendre: vi.fn(), onNaviguer: vi.fn() });

test('affiche la seance du jour generee par l\'app et la regularite', () => {
  render(<Accueil etat={etat()} maintenant={maintenant} enCours={false} {...actions()} />);
  expect(screen.getByText('Séance A')).toBeTruthy();
  expect(screen.getByText(/générée par l'app/)).toBeTruthy();
  expect(screen.getByText('0/3 cette semaine')).toBeTruthy();
  expect(screen.getByText(/Squat à la barre/)).toBeTruthy();
});

test('seance preparee par Claude avec son message', () => {
  const prochaine: SeancePrevue = {
    id: '2026-11-04-A', type: 'A', blocId: 'b1', semaine: 1, source: 'claude', genereeLe: '', message: 'Jambes légères avant le match.',
    exercices: [{ exerciceId: 'goblet-squat', series: [{ reps: 8, charge: 12 }], repsMin: 6, repsMax: 8, repos: 150 }],
  };
  render(<Accueil etat={etat({ prochaine })} maintenant={maintenant} enCours={false} {...actions()} />);
  expect(screen.getByText(/préparée par Claude/)).toBeTruthy();
  expect(screen.getByText('Jambes légères avant le match.')).toBeTruthy();
});

test('douleur au dos : apercu et seance lancee avec les remplacements', () => {
  const a = actions();
  render(<Accueil etat={etat()} maintenant={maintenant} enCours={false} {...a} />);
  fireEvent.click(screen.getByRole('button', { name: 'Oui' }));
  expect(screen.getByText(/Goblet squat/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Commencer' }));
  const [seance, douleur] = a.onCommencer.mock.calls[0];
  expect(seance.exercices[0].exerciceId).toBe('goblet-squat');
  expect(douleur).toBe(true);
});

test('seance D optionnelle', () => {
  const a = actions();
  render(<Accueil etat={etat()} maintenant={maintenant} enCours={false} {...a} />);
  fireEvent.click(screen.getByRole('button', { name: 'Séance D (optionnelle)' }));
  expect(a.onCommencer.mock.calls[0][0].type).toBe('D');
});

test('sans programme -> invitation a lancer la commande sur le Mac', () => {
  render(<Accueil etat={etat({ programme: null })} maintenant={maintenant} enCours={false} {...actions()} />);
  expect(screen.getByText(/prépare ma séance/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Commencer' })).toBeNull();
});

test('bloc termine -> bandeau', () => {
  const historique = Array.from({ length: 18 }, () => s('A'));
  render(<Accueil etat={etat({ historique })} maintenant={maintenant} enCours={false} {...actions()} />);
  expect(screen.getByText(/Bloc terminé/)).toBeTruthy();
});

test('erreur et seance en cours a reprendre', () => {
  const a = actions();
  render(<Accueil etat={etat({ erreur: 'Pas de connexion — données en cache.', horsLigne: true })} maintenant={maintenant} enCours={true} {...a} />);
  expect(screen.getByText('Pas de connexion — données en cache.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Reprendre la séance en cours' }));
  expect(a.onReprendre).toHaveBeenCalled();
});

test('seance en cours : Commencer demande confirmation avant d\'abandonner', () => {
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  const a = actions();
  render(<Accueil etat={etat()} maintenant={maintenant} enCours={true} {...a} />);
  fireEvent.click(screen.getByRole('button', { name: 'Commencer' }));
  fireEvent.click(screen.getByRole('button', { name: 'Séance D (optionnelle)' }));
  expect(window.confirm).toHaveBeenCalledTimes(2);
  expect(a.onCommencer).not.toHaveBeenCalled();
});
