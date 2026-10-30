import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { SeanceEnCours } from '../../src/ui/SeanceEnCours';
import { CLES } from '../../src/stockage/local';
import type { SeancePrevue, SeanceRealisee } from '../../src/domaine/types';
import { prevuDe } from '../aides';
import { stockageMemoire } from '../stockage/fauxGitHub';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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
    { reps: 7, charge: 18, difficulte: 'dur' },
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

test('terminer met la seance en file d\'attente avant d\'effacer la seance en cours', () => {
  const stockage = stockageMemoire();
  render(<SeanceEnCours seance={seance([prevuDe('goblet-squat', 16, 1)])} douleurDos={false} onTerminer={() => {}} stockage={stockage} maintenant={() => 0} />);
  fireEvent.click(screen.getByRole('button', { name: 'Correct' }));
  expect((stockage.lire(CLES.attente) as SeanceRealisee[]).map(x => x.id)).toEqual(['2026-11-02-A']);
  expect(stockage.lire(CLES.enCours)).toBeNull();
});

test('terminer sans aucune serie abandonne sans enregistrer', () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  const stockage = stockageMemoire();
  const onTerminer = vi.fn();
  const onAbandon = vi.fn();
  render(<SeanceEnCours seance={seance()} douleurDos={false} onTerminer={onTerminer} onAbandon={onAbandon} stockage={stockage} maintenant={() => 0} />);
  fireEvent.click(screen.getByRole('button', { name: 'Terminer la séance' }));
  expect(onAbandon).toHaveBeenCalled();
  expect(onTerminer).not.toHaveBeenCalled();
  expect(stockage.lire(CLES.attente)).toBeNull();
  expect(stockage.lire(CLES.enCours)).toBeNull();
});

test('la charge saisie est reprise a la serie suivante du meme exercice', () => {
  render(<SeanceEnCours seance={seance()} douleurDos={false} onTerminer={() => {}} stockage={stockageMemoire()} maintenant={() => 0} />);
  saisir('Charge (kg)', '42.5');
  fireEvent.click(screen.getByRole('button', { name: 'Correct' }));
  fireEvent.click(screen.getByRole('button', { name: 'Passer le repos' }));
  expect(champ('Charge (kg)').value).toBe('42.5');
});

test('virgule decimale acceptee', () => {
  let resultat: SeanceRealisee | null = null;
  render(<SeanceEnCours seance={seance([prevuDe('goblet-squat', 16, 1)])} douleurDos={false} onTerminer={s => (resultat = s)} stockage={stockageMemoire()} maintenant={() => 0} />);
  saisir('Charge (kg)', '17,5');
  fireEvent.click(screen.getByRole('button', { name: 'Correct' }));
  expect(resultat!.exercices[0].series[0].charge).toBe(17.5);
});

test('charge tres superieure a la prevue : confirmation demandee', () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<SeanceEnCours seance={seance()} douleurDos={false} onTerminer={() => {}} stockage={stockageMemoire()} maintenant={() => 0} />);
  saisir('Charge (kg)', '400');
  fireEvent.click(screen.getByRole('button', { name: 'Correct' }));
  expect(confirm).toHaveBeenCalled();
  expect(screen.getByText('Série 1/3')).toBeTruthy();
});

const corde = () => ({ exerciceId: 'corde-a-sauter', series: [{ reps: 900, charge: 0 }], repsMin: 900, repsMax: 900, repos: 60 });

test('echauffement : chrono de 15 min puis exercice suivant automatiquement', async () => {
  let t = 0;
  const stockage = stockageMemoire();
  render(<SeanceEnCours seance={seance([corde(), prevuDe('goblet-squat', 16, 2)])} douleurDos={false} onTerminer={() => {}} stockage={stockage} maintenant={() => t} />);
  expect(screen.getByText('Échauffement')).toBeTruthy();
  expect(screen.getByText('15:00')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
  t = 300_000;
  expect(await screen.findByText('10:00', {}, { timeout: 1500 })).toBeTruthy();
  t = 901_000;
  expect(await screen.findByText('Repos', {}, { timeout: 1500 })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Passer le repos' }));
  expect(screen.getByRole('heading', { name: 'Goblet squat' })).toBeTruthy();
});

test('echauffement arrete plus tot : duree reelle enregistree', () => {
  let t = 0;
  let resultat: SeanceRealisee | null = null;
  render(<SeanceEnCours seance={seance([corde()])} douleurDos={false} onTerminer={s => (resultat = s)} stockage={stockageMemoire()} maintenant={() => t} />);
  fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
  t = 600_000;
  fireEvent.click(screen.getByRole('button', { name: 'Arrêter l\'échauffement' }));
  expect(resultat!.exercices[0].series).toEqual([{ reps: 600, charge: 0, difficulte: 'correct' }]);
});

test('echauffement en cours : repris apres rechargement', () => {
  let t = 0;
  const stockage = stockageMemoire();
  const props = { seance: seance([corde(), prevuDe('goblet-squat', 16, 2)]), douleurDos: false, onTerminer: () => {}, stockage, maintenant: () => t };
  const { unmount } = render(<SeanceEnCours {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
  unmount();
  t = 60_000;
  render(<SeanceEnCours {...props} />);
  expect(screen.getByText('14:00')).toBeTruthy();
});
