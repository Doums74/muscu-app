import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { Configuration } from '../../src/ui/Configuration';
import { FinSeance } from '../../src/ui/FinSeance';
import { ClientGitHub } from '../../src/stockage/github';
import { CLES } from '../../src/stockage/local';
import { realisee } from '../aides';
import { fauxGitHub, stockageMemoire } from '../stockage/fauxGitHub';

afterEach(cleanup);

const remplir = (label: string, valeur: string) => fireEvent.input(screen.getByLabelText(label), { target: { value: valeur } });

test('configuration : pre-remplie, enregistre si la cle fonctionne', async () => {
  const gh = fauxGitHub({ 'programme.json': {} });
  const stockage = stockageMemoire();
  const onEnregistre = vi.fn();
  render(<Configuration stockage={stockage} fetchFn={gh.fetchFn} onEnregistre={onEnregistre} />);
  expect((screen.getByLabelText('Propriétaire GitHub') as HTMLInputElement).value).toBe('Doums74');
  expect((screen.getByLabelText('Dépôt de données') as HTMLInputElement).value).toBe('muscu-data');
  remplir('Clé d\'accès (token)', 'tk');
  fireEvent.click(screen.getByRole('button', { name: 'Tester et enregistrer' }));
  await vi.waitFor(() => expect(onEnregistre).toHaveBeenCalled());
  expect(stockage.lire(CLES.config)).toEqual({ proprietaire: 'Doums74', depot: 'muscu-data', token: 'tk' });
});

test('configuration : affiche l\'erreur si la cle est refusee', async () => {
  const gh = fauxGitHub();
  gh.etat.statutForce = 401;
  const onEnregistre = vi.fn();
  render(<Configuration stockage={stockageMemoire()} fetchFn={gh.fetchFn} onEnregistre={onEnregistre} />);
  remplir('Clé d\'accès (token)', 'mauvais');
  fireEvent.click(screen.getByRole('button', { name: 'Tester et enregistrer' }));
  expect(await screen.findByText(/refusée/)).toBeTruthy();
  expect(onEnregistre).not.toHaveBeenCalled();
});

test('fin de seance : envoyee', async () => {
  const gh = fauxGitHub({ 'historique.json': [] });
  const client = new ClientGitHub({ proprietaire: 'moi', depot: 'd', token: 't' }, gh.fetchFn);
  const seance = realisee('squat-barre', [{ reps: 8, charge: 40, difficulte: 'correct' }]);
  render(<FinSeance seance={seance} client={client} stockage={stockageMemoire()} onRetour={() => {}} />);
  expect(await screen.findByText('Séance envoyée ✓')).toBeTruthy();
  expect(screen.getByText(/Squat à la barre/)).toBeTruthy();
  expect(screen.getByText('8 × 40 kg')).toBeTruthy();
});

test('fin de seance : hors ligne -> en attente', async () => {
  const gh = fauxGitHub();
  gh.etat.horsLigne = true;
  const client = new ClientGitHub({ proprietaire: 'moi', depot: 'd', token: 't' }, gh.fetchFn);
  const seance = realisee('squat-barre', [{ reps: 8, charge: 40, difficulte: 'correct' }]);
  render(<FinSeance seance={seance} client={client} stockage={stockageMemoire()} onRetour={() => {}} />);
  expect(await screen.findByText('Enregistrée — sera envoyée au retour du réseau')).toBeTruthy();
});
