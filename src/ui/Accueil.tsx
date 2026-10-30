import { useMemo, useState } from 'preact/hooks';
import { appliquerDouleurDos } from '../domaine/ajustements';
import { trouverExercice } from '../domaine/bibliotheque';
import { choisirSeance, genererSeanceLocale } from '../domaine/progression';
import { blocTermine } from '../domaine/rotation';
import { regulariteSemaine } from '../domaine/stats';
import type { SeancePrevue } from '../domaine/types';
import type { Etat } from '../stockage/depot';
import { cible } from './SeanceEnCours';

export type Ecran = 'historique' | 'progression' | 'reglages';

interface Props {
  etat: Etat;
  maintenant: Date;
  enCours: boolean;
  onCommencer(seance: SeancePrevue, douleurDos: boolean): void;
  onReprendre(): void;
  onNaviguer(ecran: Ecran): void;
}

function Navigation({ onNaviguer }: Pick<Props, 'onNaviguer'>) {
  return (
    <nav class="navigation">
      <button onClick={() => onNaviguer('historique')}>Historique</button>
      <button onClick={() => onNaviguer('progression')}>Progression</button>
      <button onClick={() => onNaviguer('reglages')}>Réglages</button>
    </nav>
  );
}

export function Accueil({ etat, maintenant, enCours, onCommencer, onReprendre, onNaviguer }: Props) {
  const [douleurDos, setDouleurDos] = useState<boolean | null>(null);
  const { programme, historique } = etat;

  const choix = useMemo(
    () => (programme ? choisirSeance(programme, etat.prochaine, historique, maintenant) : null),
    [programme, etat.prochaine, historique, maintenant],
  );
  const regularite = regulariteSemaine(historique, maintenant);
  const erreur = etat.erreur && <p class="bandeau erreur">{etat.erreur}</p>;

  if (!programme || !choix) {
    return (
      <main class="ecran accueil">
        {erreur}
        <h1>Muscu</h1>
        <p class="bandeau">Aucun programme pour l'instant. Lance « prépare ma séance » dans Claude sur le Mac pour créer ton premier bloc.</p>
        <Navigation onNaviguer={onNaviguer} />
      </main>
    );
  }

  const seance = douleurDos ? appliquerDouleurDos(choix.seance, historique) : choix.seance;

  return (
    <main class="ecran accueil">
      {erreur}
      <header class="entete">
        <h1>Muscu</h1>
        <span class="regularite">
          {regularite.faites}/{regularite.objectif} cette semaine
        </span>
      </header>
      {blocTermine(historique, programme.blocId) && (
        <p class="bandeau">Bloc terminé — lance « prépare ma séance » sur le Mac pour ton bilan et le bloc suivant.</p>
      )}
      {enCours && (
        <button class="principal" onClick={onReprendre}>
          Reprendre la séance en cours
        </button>
      )}

      <section class="carte">
        <h2>Séance {seance.type}</h2>
        <p class="meta">
          Bloc {seance.blocId} · semaine {seance.semaine} · {seance.source === 'claude' ? 'préparée par Claude' : "générée par l'app"}
        </p>
        {seance.message && <p class="message">{seance.message}</p>}
        {choix.avertissements.length > 0 && (
          <ul class="avertissements">
            {choix.avertissements.map(a => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
        <ol class="apercu">
          {seance.exercices.map(ex => (
            <li key={ex.exerciceId}>
              {trouverExercice(ex.exerciceId)?.nom ?? ex.exerciceId}
              {ex.remplace && ` (remplace ${trouverExercice(ex.remplace)?.nom})`} — {ex.series.length} × {cible(ex, 0)}
            </li>
          ))}
        </ol>
      </section>

      <section class="carte">
        <p>Douleur au dos aujourd'hui ?</p>
        <div class="choix">
          <button class={douleurDos === true ? 'actif' : ''} onClick={() => setDouleurDos(true)}>
            Oui
          </button>
          <button class={douleurDos === false ? 'actif' : ''} onClick={() => setDouleurDos(false)}>
            Non
          </button>
        </div>
      </section>

      <button class="principal" onClick={() => onCommencer(seance, douleurDos === true)}>
        Commencer
      </button>
      <button
        class="secondaire"
        onClick={() => {
          const d = genererSeanceLocale(programme, historique, 'D', maintenant);
          onCommencer(douleurDos ? appliquerDouleurDos(d, historique) : d, douleurDos === true);
        }}
      >
        Séance D (optionnelle)
      </button>
      <Navigation onNaviguer={onNaviguer} />
    </main>
  );
}
