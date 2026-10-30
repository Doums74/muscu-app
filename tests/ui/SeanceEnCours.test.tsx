import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { SeanceEnCours } from '../../src/ui/SeanceEnCours';
import { CLES } from '../../src/stockage/local';
import type { SeancePrevue, SeanceRealisee } from '../../src/domaine/types';
import { prevuDe } from '../aides';
import { stockageMemoire } from '../stockage/fauxGitHub';

afterEach(cleanup);

const seance = (exercices = [prevuDe('squat-barre', 40), prevuDe('goblet-squat', 16, 2)]): SeancePrevue => ({
  id: '2026-11-02-A', type: 'A', blocId: 'b1', semaine: 2, source: 'claude', genereeLe: '', exercices,
});

const champ = (nom: string) => screen.getByLabelText(nom) as HTMLInputElement;
const saisir = (nom: string, valeur: string) => fireEvent.input(champ(nom), { target: { value: valeur } });

test('affiche l\'exercice, la serie et la cible', () => {
  render(<SeanceEnCours seance={seance()} douleurDos={false} onTerminer={() => {}} stockage={stockageMemoire()} maintenant={() => 0} />);
  expect(screen.getByRole('heading', { name: 'Squat à la barre' })).toBeTruthy();
  expect(screen.getByText('Série 1/3')).toBeTruthy();
  expect(screen.getByText('8 reps · 40 kg')).toBeTruthy();
  expect(champ('Reps').value).toBe('8');
  expect(champ('Charge (kg)').value).toBe('40');
});

test('valider une serie dure non finie baisse la charge suivante', () => {
  render(<SeanceEnCours seance={seance()} douleurDos={false} onTerminer={() => {}} stockage={stockageMemoire()} maintenant={() => 0} />);
  saisir('Reps', '6');
  fireEvent.click(screen.getByRole('button', { name: 'Dur' }));
  expect(screen.getByText('Repos')).toBeTruthy();
  expect(screen.getByText('2:30')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Passer le repos' }));
  expect(screen.getByText('Série 2/3')).toBeTruthy();
  expect(screen.getByText('8 reps · 37.5 kg')).toBeTruthy();
});

test('le repos se termine tout seul quand le temps est ecoule', async () => {
  let t = 0;
  render(<SeanceEnCours seance={seance()} douleurDos={false} onTerminer={() => {}} stockage={stockageMemoire()} maintenant={() => t} />);
  fireEvent.click(screen.getByRole('button', { name: 'Correct' }));
  expect(screen.getByText('Repos')).toBeTruthy();
  t = 151_000;
  expect(await screen.findByText('Série 2/3', {}, { timeout: 1500 })).toBeTruthy();
});

test('reprend une seance en cours apres rechargement', () => {
  const stockage = stockageMemoire();
  const props = { seance: seance(), douleurDos: false, onTerminer: () => {}, stockage, maintenant: () => 0 };
  const { unmount } = render(<SeanceEnCours {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Facile' }));
  unmount();
  render(<SeanceEnCours {...props} />);
  expect(screen.getByText('Repos')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Passer le repos' }));
  expect(screen.getByText('Série 2/3')).toBeTruthy();
});

test('terminer renvoie toutes les series saisies', () => {
  const stockage = stockageMemoire();
  let resultat: SeanceRealisee | null = null;
  render(
    <SeanceEnCours seance={seance([prevuDe('goblet-squat', 16, 2)])} douleurDos={true} onTerminer={s => (resultat = s)} stockage={stockage} maintenant={() => 0} />,
  );
  saisir('Charge (kg)', '18');
  fireEvent.click(screen.getByRole('button', { name: 'Correct' }));
  fireEvent.click(screen.getByRole('button', { name: 'Passer le repos' }));
  saisir('Reps', '7');
  fireEvent.click(screen.getByRole('button', { name: 'Dur' }));
  expect(resultat).not.toBeNull();
  expect(resultat!).toMatchObject({ id: '2026-11-02-A', type: 'A', blocId: 'b1', semaine: 2, douleurDos: true });
  expect(resultat!.exercices[0].series).toEqual([
    { reps: 8, charge: 18, difficulte: 'correct' },
    { reps: 7, charge: 16, difficulte: 'dur' },
  ]);
  expect(stockage.lire(CLES.enCours)).toBeNull();
});

test('terminer plus tot ne garde que les exercices commences', () => {
  let resultat: SeanceRealisee | null = null;
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<SeanceEnCours seance={seance()} douleurDos={false} onTerminer={s => (resultat = s)} stockage={stockageMemoire()} maintenant={() => 0} />);
  fireEvent.click(screen.getByRole('button', { name: 'Correct' }));
  fireEvent.click(screen.getByRole('button', { name: 'Terminer la séance' }));
  expect(resultat!.exercices).toHaveLength(1);
  expect(resultat!.exercices[0].series).toHaveLength(1);
});

test('exercice au poids du corps : pas de champ charge, cible en secondes', () => {
  const planche = { ...prevuDe('planche', 0, 2, 30, 20, 40), repos: 50 };
  render(<SeanceEnCours seance={seance([planche])} douleurDos={false} onTerminer={() => {}} stockage={stockageMemoire()} maintenant={() => 0} />);
  expect(screen.getByText('30 s')).toBeTruthy();
  expect(screen.queryByLabelText('Charge (kg)')).toBeNull();
  expect(champ('Secondes').value).toBe('30');
});
