import type { ExerciceProgramme, Programme } from './domaine/types';
import type { Stockage } from './stockage/local';

const ep = (exerciceId: string, series: number, repsMin: number, repsMax: number, chargeDepart: number, repos: number): ExerciceProgramme => ({
  exerciceId, series, repsMin, repsMax, chargeDepart, repos,
});

/** Programme d'exemple (mode ?demo). */
export const PROGRAMME_DEMO: Programme = {
  blocId: 'demo-1',
  debut: '2026-11-02',
  seances: {
    A: [ep('saut-boite', 3, 3, 5, 0, 90), ep('goblet-squat', 3, 6, 8, 12, 150), ep('developpe-couche-halteres', 3, 6, 8, 12, 150), ep('fente-arriere', 2, 8, 10, 6, 75), ep('bird-dog', 2, 6, 8, 0, 45)],
    B: [ep('lancer-rotatif-medecine-ball', 3, 5, 6, 4, 90), ep('hip-thrust', 3, 6, 8, 30, 150), ep('tirage-vertical', 3, 6, 8, 30, 150), ep('fente-laterale', 2, 8, 10, 6, 75), ep('pallof-press', 2, 8, 10, 7.5, 45)],
    C: [ep('saut-lateral', 3, 4, 6, 0, 90), ep('presse-cuisses', 3, 6, 8, 60, 150), ep('rowing-poitrine-appuyee', 3, 6, 8, 10, 150), ep('step-up', 2, 8, 10, 6, 75), ep('mcgill-curl-up', 2, 5, 6, 0, 45)],
    D: [ep('planche', 3, 20, 40, 0, 45), ep('planche-laterale', 2, 15, 30, 0, 45), ep('dead-bug', 2, 6, 10, 0, 45), ep('pont-fessier', 2, 10, 15, 0, 45)],
  },
};

/** Faux serveur GitHub en mémoire pour essayer l'app sans compte. */
export function fetchDemo(): typeof fetch {
  const fichiers = new Map<string, string>([
    ['programme.json', JSON.stringify(PROGRAMME_DEMO)],
    ['historique.json', '[]'],
  ]);
  let version = 0;
  const b64 = (t: string) => btoa(String.fromCharCode(...new TextEncoder().encode(t)));
  const deB64 = (b: string) => new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0)));
  const rep = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut });

  return (async (url: string | URL | Request, init?: RequestInit) => {
    const chemin = decodeURIComponent(String(url).split('/contents/')[1]);
    if ((init?.method ?? 'GET') === 'GET') {
      const texte = fichiers.get(chemin);
      return texte === undefined ? rep(404, {}) : rep(200, { content: b64(texte), sha: `demo${version}` });
    }
    fichiers.set(chemin, deB64(JSON.parse(String(init!.body)).content));
    return rep(200, { content: { sha: `demo${++version}` } });
  }) as typeof fetch;
}

export function stockageDemo(): Stockage {
  const m = new Map<string, string>();
  return {
    lire: <T,>(cle: string) => (m.has(cle) ? (JSON.parse(m.get(cle)!) as T) : null),
    ecrire: (cle, valeur) => void m.set(cle, JSON.stringify(valeur)),
    effacer: cle => void m.delete(cle),
  };
}
