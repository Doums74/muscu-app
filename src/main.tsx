import { render } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { fetchDemo, stockageDemo } from './demo';
import type { SeancePrevue, SeanceRealisee } from './domaine/types';
import { chargerEtat, type Etat } from './stockage/depot';
import { ClientGitHub, type Config } from './stockage/github';
import { CLES, stockageNavigateur } from './stockage/local';
import { Accueil, type Ecran } from './ui/Accueil';
import { Configuration } from './ui/Configuration';
import { FinSeance } from './ui/FinSeance';
import { SeanceEnCours, type EtatSeance } from './ui/SeanceEnCours';
import './style.css';

const demo = new URLSearchParams(location.search).has('demo');
const stockage = demo ? stockageDemo() : stockageNavigateur;
const fetchFn = demo ? fetchDemo() : undefined;
if (demo) stockage.ecrire(CLES.config, { proprietaire: 'demo', depot: 'demo', token: 'demo' });

type Vue =
  | { nom: 'chargement' | 'config' | 'accueil' }
  | { nom: 'seance'; seance: SeancePrevue; douleurDos: boolean }
  | { nom: 'fin'; seance: SeanceRealisee }
  | { nom: Exclude<Ecran, 'reglages'> };

function App() {
  const [config, setConfig] = useState(() => stockage.lire<Config>(CLES.config));
  const client = useMemo(() => (config ? new ClientGitHub(config, fetchFn) : null), [config]);
  const [etat, setEtat] = useState<Etat | null>(null);
  const [vue, setVue] = useState<Vue>({ nom: config ? 'chargement' : 'config' });
  const [maintenant, setMaintenant] = useState(() => new Date());

  async function recharger() {
    if (!client) return;
    setEtat(await chargerEtat(client, stockage));
    setMaintenant(new Date());
    setVue(v => (v.nom === 'chargement' ? { nom: 'accueil' } : v));
  }

  useEffect(() => {
    void recharger();
  }, [client]);

  const enCours = stockage.lire<EtatSeance>(CLES.enCours);

  if (vue.nom === 'config' || !client) {
    return (
      <Configuration
        stockage={stockage}
        fetchFn={fetchFn}
        onEnregistre={c => {
          setConfig(c);
          setVue({ nom: 'chargement' });
        }}
      />
    );
  }

  if (vue.nom === 'chargement' || !etat) return <main class="ecran"><p class="chargement">Chargement…</p></main>;

  if (vue.nom === 'seance')
    return (
      <SeanceEnCours
        seance={vue.seance}
        douleurDos={vue.douleurDos}
        stockage={stockage}
        onTerminer={s => setVue({ nom: 'fin', seance: s })}
      />
    );

  if (vue.nom === 'fin')
    return (
      <FinSeance
        seance={vue.seance}
        client={client}
        stockage={stockage}
        onRetour={() => {
          setVue({ nom: 'chargement' });
          void recharger();
        }}
      />
    );

  return (
    <>
      {demo && <p class="bandeau">Mode démo — rien n'est enregistré.</p>}
      <Accueil
        etat={etat}
        maintenant={maintenant}
        enCours={enCours !== null}
        onCommencer={(seance, douleurDos) => {
          stockage.effacer(CLES.enCours);
          setVue({ nom: 'seance', seance, douleurDos });
        }}
        onReprendre={() => enCours && setVue({ nom: 'seance', seance: enCours.seance, douleurDos: enCours.douleurDos })}
        onNaviguer={ecran => setVue(ecran === 'reglages' ? { nom: 'config' } : { nom: 'accueil' })}
      />
    </>
  );
}

render(<App />, document.getElementById('app')!);
