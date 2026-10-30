import { chargerEtat, enregistrerSeance, etatDepuisCache, mettreEnAttente, synchroniser } from '../../src/stockage/depot';
import { ClientGitHub } from '../../src/stockage/github';
import type { Programme } from '../../src/domaine/types';
import { s } from '../aides';
import { fauxGitHub, stockageMemoire } from './fauxGitHub';

const config = { proprietaire: 'moi', depot: 'muscu-data', token: 'tk' };
import { PROGRAMME_DEMO } from '../../src/demo';

const programme: Programme = { ...PROGRAMME_DEMO, blocId: 'b1' };

function monter(fichiers: Record<string, unknown> = { 'programme.json': programme, 'historique.json': [] }) {
  const gh = fauxGitHub(fichiers);
  return { gh, client: new ClientGitHub(config, gh.fetchFn), stockage: stockageMemoire() };
}

test('chargerEtat lit les trois fichiers et remplit le cache', async () => {
  const { client, stockage } = monter({ 'programme.json': programme, 'historique.json': [s('A')] });
  const etat = await chargerEtat(client, stockage);
  expect(etat).toMatchObject({ programme, prochaine: null, horsLigne: false, erreur: null });
  expect(etat.historique).toHaveLength(1);
  expect(stockage.lire('muscu.cache')).toMatchObject({ programme });
});

test('chargerEtat sans historique distant -> liste vide', async () => {
  const { client, stockage } = monter({ 'programme.json': programme });
  expect((await chargerEtat(client, stockage)).historique).toEqual([]);
});

test('hors ligne -> cache et message', async () => {
  const { gh, client, stockage } = monter();
  await chargerEtat(client, stockage);
  gh.etat.horsLigne = true;
  const etat = await chargerEtat(client, stockage);
  expect(etat).toMatchObject({ programme, horsLigne: true });
  expect(etat.erreur).toContain('connexion');
});

test('token invalide renvoie le cache et une erreur lisible', async () => {
  const { gh, client, stockage } = monter();
  await chargerEtat(client, stockage);
  gh.etat.statutForce = 401;
  const etat = await chargerEtat(client, stockage);
  expect(etat.programme).toEqual(programme);
  expect(etat.erreur).toBe('Clé GitHub invalide ou expirée — mets-la à jour dans Réglages.');
});

test('enregistrerSeance en ligne -> envoyee, ajoutee a l\'historique distant, file videe', async () => {
  const { gh, client, stockage } = monter();
  const seance = s('A');
  expect(await enregistrerSeance(client, stockage, seance)).toBe('envoyee');
  expect(gh.lireJson('historique.json')).toEqual([seance]);
  expect(stockage.lire('muscu.attente') ?? []).toEqual([]);
});

test('met en file d\'attente hors ligne', async () => {
  const { gh, client, stockage } = monter();
  gh.etat.horsLigne = true;
  const seance = s('A');
  expect(await enregistrerSeance(client, stockage, seance)).toBe('en-attente');
  expect(stockage.lire('muscu.attente')).toEqual([seance]);
  const etat = await chargerEtat(client, stockage);
  expect(etat.historique.map(h => h.id)).toEqual([seance.id]);
});

test('la file d\'attente part au prochain chargement en ligne', async () => {
  const { gh, client, stockage } = monter();
  gh.etat.horsLigne = true;
  const seance = s('A');
  await enregistrerSeance(client, stockage, seance);
  gh.etat.horsLigne = false;
  const etat = await chargerEtat(client, stockage);
  expect(gh.lireJson('historique.json')).toEqual([seance]);
  expect(etat.historique).toHaveLength(1);
  expect(stockage.lire('muscu.attente') ?? []).toEqual([]);
});

test('ne duplique pas une seance deja envoyee', async () => {
  const seance = s('A');
  const { gh, client, stockage } = monter({ 'programme.json': programme, 'historique.json': [seance] });
  stockage.ecrire('muscu.attente', [seance]);
  expect(await synchroniser(client, stockage)).toBe(0);
  expect(gh.lireJson('historique.json')).toHaveLength(1);
  expect(stockage.lire('muscu.attente') ?? []).toEqual([]);
});

test('reessaie une fois sur conflit de sha', async () => {
  const { gh, client, stockage } = monter();
  gh.etat.conflitsRestants = 1;
  stockage.ecrire('muscu.attente', [s('A')]);
  expect(await synchroniser(client, stockage)).toBe(1);
  expect(gh.lireJson('historique.json')).toHaveLength(1);
});

test('deux conflits -> la seance reste en attente', async () => {
  const { gh, client, stockage } = monter();
  gh.etat.conflitsRestants = 2;
  const seance = s('A');
  expect(await enregistrerSeance(client, stockage, seance)).toBe('en-attente');
  expect(stockage.lire('muscu.attente')).toEqual([seance]);
});

test('un programme distant invalide ne remplace pas le bon programme en cache', async () => {
  const { gh, client, stockage } = monter();
  await chargerEtat(client, stockage);
  gh.depot.set('programme.json', { texte: JSON.stringify({ ...programme, seances: { ...programme.seances, A: [] } }), sha: 'x' });
  const etat = await chargerEtat(client, stockage);
  expect(etat.programme).toEqual(programme);
  expect(etat.erreur).toContain('programme.json');
});

test('etatDepuisCache : disponible immediatement, sans reseau', async () => {
  const { client, stockage } = monter();
  expect(etatDepuisCache(stockage)).toBeNull();
  await chargerEtat(client, stockage);
  expect(etatDepuisCache(stockage)).toMatchObject({ programme, horsLigne: false, erreur: null });
});

test('mettreEnAttente puis chargerEtat hors ligne : la seance est dans l\'historique', async () => {
  const { gh, client, stockage } = monter();
  const seance = s('A');
  mettreEnAttente(stockage, seance);
  mettreEnAttente(stockage, seance);
  expect(stockage.lire('muscu.attente')).toEqual([seance]);
  gh.etat.horsLigne = true;
  expect((await chargerEtat(client, stockage)).historique).toHaveLength(1);
});
