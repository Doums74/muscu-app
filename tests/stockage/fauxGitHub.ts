import type { Stockage } from '../../src/stockage/local';

const b64 = (texte: string) => Buffer.from(texte, 'utf-8').toString('base64').replace(/(.{60})/g, '$1\n');

/** Faux serveur de l'API Contents de GitHub, en mémoire. */
export function fauxGitHub(fichiers: Record<string, unknown> = {}) {
  const depot = new Map<string, { texte: string; sha: string }>();
  let version = 0;
  for (const [chemin, contenu] of Object.entries(fichiers)) depot.set(chemin, { texte: JSON.stringify(contenu), sha: `sha${++version}` });

  const etat = { horsLigne: false, bloque: false, ecriture: true, depotExiste: true, statutForce: 0, conflitsRestants: 0, appels: [] as { methode: string; chemin: string; init?: RequestInit }[] };

  const fetchFn = (async (url: string, init?: RequestInit) => {
    if (etat.horsLigne) throw new TypeError('Failed to fetch');
    if (etat.bloque)
      return new Promise((_, rejeter) => init?.signal?.addEventListener('abort', () => rejeter(init.signal!.reason)));
    const rep0 = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut });
    if (!String(url).includes('/contents/')) {
      if (etat.statutForce) return rep0(etat.statutForce, {});
      return etat.depotExiste ? rep0(200, { permissions: { push: etat.ecriture } }) : rep0(404, { message: 'Not Found' });
    }
    const chemin = decodeURIComponent(String(url).split('/contents/')[1]);
    const methode = init?.method ?? 'GET';
    etat.appels.push({ methode, chemin, init });
    const rep = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut });
    if (etat.statutForce) return rep(etat.statutForce, { message: 'Bad credentials' });

    if (methode === 'GET') {
      const f = depot.get(chemin);
      return f ? rep(200, { content: b64(f.texte), sha: f.sha, encoding: 'base64' }) : rep(404, { message: 'Not Found' });
    }
    const corps = JSON.parse(String(init!.body));
    if (etat.conflitsRestants > 0) {
      etat.conflitsRestants--;
      return rep(409, { message: 'conflict' });
    }
    const actuel = depot.get(chemin);
    if ((actuel?.sha ?? undefined) !== corps.sha) return rep(422, { message: 'sha mismatch' });
    const sha = `sha${++version}`;
    depot.set(chemin, { texte: Buffer.from(corps.content, 'base64').toString('utf-8'), sha });
    return rep(actuel ? 200 : 201, { content: { sha } });
  }) as unknown as typeof fetch;

  const lireJson = (chemin: string) => JSON.parse(depot.get(chemin)!.texte);
  return { fetchFn, etat, depot, lireJson };
}

export function stockageMemoire(): Stockage & { donnees: Map<string, unknown> } {
  const donnees = new Map<string, unknown>();
  return {
    donnees,
    lire: <T,>(cle: string) => (donnees.has(cle) ? structuredClone(donnees.get(cle)) as T : null),
    ecrire: (cle, valeur) => void donnees.set(cle, structuredClone(valeur)),
    effacer: cle => void donnees.delete(cle),
  };
}
