export interface Config {
  proprietaire: string;
  depot: string;
  token: string;
}

export class ErreurGitHub extends Error {
  constructor(public statut: number, message: string) {
    super(message);
    this.name = 'ErreurGitHub';
  }
}

function versBase64(texte: string): string {
  const octets = new TextEncoder().encode(texte);
  let binaire = '';
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(binaire);
}

function depuisBase64(b64: string): string {
  const binaire = atob(b64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(binaire, c => c.charCodeAt(0)));
}

/** Accès aux fichiers JSON d'un dépôt via l'API Contents de GitHub. */
export class ClientGitHub {
  constructor(
    private config: Config,
    private fetchFn: typeof fetch = (...args) => fetch(...args),
    private delaiMs = 8000,
  ) {}

  private racine() {
    const { proprietaire, depot } = this.config;
    return `https://api.github.com/repos/${encodeURIComponent(proprietaire)}/${encodeURIComponent(depot)}`;
  }

  private url(chemin: string) {
    return `${this.racine()}/contents/${encodeURIComponent(chemin)}`;
  }

  /** Requête abandonnée après `delaiMs` : un réseau faible à la salle ne doit pas bloquer l'app. */
  private requete(url: string, init: RequestInit) {
    return this.fetchFn(url, { ...init, signal: AbortSignal.timeout(this.delaiMs) });
  }

  /** Vérifie que le dépôt existe et est accessible avec ce token. */
  async verifierAcces(): Promise<{ ecriture: boolean }> {
    const rep = await this.requete(this.racine(), { headers: this.entetes(), cache: 'no-store' });
    if (!rep.ok) throw new ErreurGitHub(rep.status, `Dépôt inaccessible (${rep.status}).`);
    const corps = (await rep.json()) as { permissions?: { push?: boolean } };
    return { ecriture: corps.permissions?.push === true };
  }

  private entetes() {
    return {
      Authorization: `Bearer ${this.config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  async lire<T>(chemin: string): Promise<{ contenu: T; sha: string } | null> {
    const rep = await this.requete(this.url(chemin), { headers: this.entetes(), cache: 'no-store' });
    if (rep.status === 404) return null;
    if (!rep.ok) throw new ErreurGitHub(rep.status, `Lecture de ${chemin} impossible (${rep.status}).`);
    const corps = (await rep.json()) as { content: string; sha: string };
    return { contenu: JSON.parse(depuisBase64(corps.content)) as T, sha: corps.sha };
  }

  async ecrire(chemin: string, contenu: unknown, sha: string | null, message: string): Promise<string> {
    const rep = await this.requete(this.url(chemin), {
      method: 'PUT',
      headers: this.entetes(),
      body: JSON.stringify({ message, content: versBase64(JSON.stringify(contenu, null, 2) + '\n'), ...(sha ? { sha } : {}) }),
    });
    if (!rep.ok) throw new ErreurGitHub(rep.status, `Écriture de ${chemin} impossible (${rep.status}).`);
    const corps = (await rep.json()) as { content: { sha: string } };
    return corps.content.sha;
  }
}
