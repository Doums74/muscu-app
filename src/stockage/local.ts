export interface Stockage {
  lire<T>(cle: string): T | null;
  ecrire(cle: string, valeur: unknown): void;
  effacer(cle: string): void;
}

export const CLES = {
  config: 'muscu.config',
  cache: 'muscu.cache',
  attente: 'muscu.attente',
  enCours: 'muscu.enCours',
} as const;

export const stockageNavigateur: Stockage = {
  lire<T>(cle: string): T | null {
    try {
      const brut = localStorage.getItem(cle);
      return brut === null ? null : (JSON.parse(brut) as T);
    } catch {
      return null;
    }
  },
  ecrire(cle, valeur) {
    localStorage.setItem(cle, JSON.stringify(valeur));
  },
  effacer(cle) {
    localStorage.removeItem(cle);
  },
};
