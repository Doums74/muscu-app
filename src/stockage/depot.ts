import type { Programme, SeancePrevue, SeanceRealisee } from '../domaine/types';
import { ClientGitHub, ErreurGitHub } from './github';
import { CLES, type Stockage } from './local';

export interface Etat {
  programme: Programme | null;
  prochaine: SeancePrevue | null;
  historique: SeanceRealisee[];
  horsLigne: boolean;
  erreur: string | null;
}

interface Cache {
  programme: Programme | null;
  prochaine: SeancePrevue | null;
  historique: SeanceRealisee[];
}

const HISTORIQUE = 'historique.json';

function fusionner(base: SeanceRealisee[], ajouts: SeanceRealisee[]): SeanceRealisee[] {
  const ids = new Set(base.map(s => s.id));
  return [...base, ...ajouts.filter(s => !ids.has(s.id))].sort((a, b) => a.date.localeCompare(b.date));
}

function messageErreur(e: unknown): string {
  if (e instanceof ErreurGitHub) {
    if (e.statut === 401) return 'Clé GitHub invalide ou expirée — mets-la à jour dans Réglages.';
    if (e.statut === 403 || e.statut === 404) return 'Accès au dépôt refusé — vérifie le propriétaire, le dépôt et les droits de la clé.';
    return `Erreur GitHub (${e.statut}) — données en cache.`;
  }
  return 'Pas de connexion — données en cache.';
}

const attente = (stockage: Stockage) => stockage.lire<SeanceRealisee[]>(CLES.attente) ?? [];

export async function chargerEtat(client: ClientGitHub, stockage: Stockage): Promise<Etat> {
  try {
    if (attente(stockage).length) await synchroniser(client, stockage).catch(() => 0);
    const [programme, prochaine, historique] = await Promise.all([
      client.lire<Programme>('programme.json'),
      client.lire<SeancePrevue>('prochaine-seance.json'),
      client.lire<SeanceRealisee[]>(HISTORIQUE),
    ]);
    const cache: Cache = {
      programme: programme?.contenu ?? null,
      prochaine: prochaine?.contenu ?? null,
      historique: historique?.contenu ?? [],
    };
    stockage.ecrire(CLES.cache, cache);
    return { ...cache, historique: fusionner(cache.historique, attente(stockage)), horsLigne: false, erreur: null };
  } catch (e) {
    const cache = stockage.lire<Cache>(CLES.cache) ?? { programme: null, prochaine: null, historique: [] };
    return { ...cache, historique: fusionner(cache.historique, attente(stockage)), horsLigne: true, erreur: messageErreur(e) };
  }
}

export async function enregistrerSeance(
  client: ClientGitHub,
  stockage: Stockage,
  seance: SeanceRealisee,
): Promise<'envoyee' | 'en-attente'> {
  stockage.ecrire(CLES.attente, fusionner(attente(stockage), [seance]));
  try {
    await synchroniser(client, stockage);
    return 'envoyee';
  } catch {
    return 'en-attente';
  }
}

async function envoyer(client: ClientGitHub, enAttente: SeanceRealisee[]): Promise<{ envoyees: number; historique: SeanceRealisee[] }> {
  const distant = await client.lire<SeanceRealisee[]>(HISTORIQUE);
  const actuel = distant?.contenu ?? [];
  const historique = fusionner(actuel, enAttente);
  const envoyees = historique.length - actuel.length;
  if (envoyees > 0) {
    const ids = enAttente.filter(s => !actuel.some(a => a.id === s.id)).map(s => s.id);
    await client.ecrire(HISTORIQUE, historique, distant?.sha ?? null, `séance ${ids.join(', ')}`);
  }
  return { envoyees, historique };
}

/** Envoie la file d'attente dans historique.json, sans doublon. Lève une erreur si l'envoi échoue. */
export async function synchroniser(client: ClientGitHub, stockage: Stockage): Promise<number> {
  const enAttente = attente(stockage);
  if (enAttente.length === 0) return 0;

  let resultat;
  try {
    resultat = await envoyer(client, enAttente);
  } catch (e) {
    if (!(e instanceof ErreurGitHub) || (e.statut !== 409 && e.statut !== 422)) throw e;
    resultat = await envoyer(client, enAttente);
  }

  stockage.effacer(CLES.attente);
  const cache = stockage.lire<Cache>(CLES.cache);
  if (cache) stockage.ecrire(CLES.cache, { ...cache, historique: resultat.historique });
  return resultat.envoyees;
}
