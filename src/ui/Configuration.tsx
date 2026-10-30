import { useState } from 'preact/hooks';
import { ClientGitHub, ErreurGitHub, type Config } from '../stockage/github';
import { CLES, stockageNavigateur, type Stockage } from '../stockage/local';

interface Props {
  onEnregistre(config: Config): void;
  stockage?: Stockage;
  fetchFn?: typeof fetch;
}

export function Configuration({ onEnregistre, stockage = stockageNavigateur, fetchFn }: Props) {
  const existante = stockage.lire<Config>(CLES.config);
  const [proprietaire, setProprietaire] = useState(existante?.proprietaire ?? 'Doums74');
  const [depot, setDepot] = useState(existante?.depot ?? 'muscu-data');
  const [token, setToken] = useState(existante?.token ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [enTest, setEnTest] = useState(false);

  async function tester(e: Event) {
    e.preventDefault();
    const config = { proprietaire: proprietaire.trim(), depot: depot.trim(), token: token.trim() };
    setEnTest(true);
    setMessage(null);
    try {
      await new ClientGitHub(config, fetchFn).lire('programme.json');
      stockage.ecrire(CLES.config, config);
      onEnregistre(config);
    } catch (err) {
      setMessage(
        err instanceof ErreurGitHub
          ? `Clé refusée par GitHub (${err.statut}). Vérifie le propriétaire, le dépôt et les droits « Contents : Read and write ».`
          : 'Pas de connexion à GitHub. Réessaie avec du réseau.',
      );
    } finally {
      setEnTest(false);
    }
  }

  return (
    <main class="ecran configuration">
      <h1>Réglages</h1>
      <p>Connexion au dépôt privé qui contient ton programme et ton historique.</p>
      <form onSubmit={tester}>
        <label>
          Propriétaire GitHub
          <input value={proprietaire} onInput={e => setProprietaire(e.currentTarget.value)} autoCapitalize="off" />
        </label>
        <label>
          Dépôt de données
          <input value={depot} onInput={e => setDepot(e.currentTarget.value)} autoCapitalize="off" />
        </label>
        <label>
          Clé d'accès (token)
          <input type="password" value={token} onInput={e => setToken(e.currentTarget.value)} autoComplete="off" />
        </label>
        {message && <p class="bandeau erreur">{message}</p>}
        <button class="principal" type="submit" disabled={enTest || !token.trim()}>
          {enTest ? 'Test en cours…' : 'Tester et enregistrer'}
        </button>
      </form>
      <p class="note">La clé reste uniquement sur ce téléphone.</p>
    </main>
  );
}
