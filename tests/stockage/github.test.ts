import { ClientGitHub, ErreurGitHub } from '../../src/stockage/github';
import { fauxGitHub } from './fauxGitHub';

const config = { proprietaire: 'moi', depot: 'muscu-data', token: 'tk' };

test('lire decode le base64 utf-8 (accents)', async () => {
  const gh = fauxGitHub({ 'profil.json': { objectif: 'tonique, épaules et dos — ski' } });
  const r = await new ClientGitHub(config, gh.fetchFn).lire<{ objectif: string }>('profil.json');
  expect(r).toEqual({ contenu: { objectif: 'tonique, épaules et dos — ski' }, sha: 'sha1' });
});

test('lire envoie le token et desactive le cache HTTP', async () => {
  const gh = fauxGitHub({ 'a.json': 1 });
  await new ClientGitHub(config, gh.fetchFn).lire('a.json');
  const init = gh.etat.appels[0].init!;
  expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tk');
  expect(init.cache).toBe('no-store');
});

test('lire renvoie null sur 404', async () => {
  expect(await new ClientGitHub(config, fauxGitHub().fetchFn).lire('absent.json')).toBeNull();
});

test('lire leve ErreurGitHub avec le statut sur 401', async () => {
  const gh = fauxGitHub({ 'a.json': 1 });
  gh.etat.statutForce = 401;
  await expect(new ClientGitHub(config, gh.fetchFn).lire('a.json')).rejects.toMatchObject({ statut: 401 });
  await expect(new ClientGitHub(config, gh.fetchFn).lire('a.json')).rejects.toBeInstanceOf(ErreurGitHub);
});

test('ecrire envoie le sha et renvoie le nouveau sha', async () => {
  const gh = fauxGitHub({ 'h.json': [] });
  const client = new ClientGitHub(config, gh.fetchFn);
  const sha = await client.ecrire('h.json', [{ note: 'séance' }], 'sha1', 'msg');
  expect(sha).toBe('sha2');
  expect(gh.lireJson('h.json')).toEqual([{ note: 'séance' }]);
});

test('ecrire cree un fichier sans sha', async () => {
  const gh = fauxGitHub();
  await new ClientGitHub(config, gh.fetchFn).ecrire('nouveau.json', { a: 1 }, null, 'msg');
  expect(gh.lireJson('nouveau.json')).toEqual({ a: 1 });
});
