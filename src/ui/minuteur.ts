/** Minuteur basé sur un timestamp de fin : reste juste même si l'écran a été verrouillé. */
export function creerMinuteur(duree: number | { fin: number }, maintenant: () => number = Date.now) {
  const fin = typeof duree === 'number' ? maintenant() + duree * 1000 : duree.fin;
  return {
    fin,
    restant: () => Math.max(0, Math.ceil((fin - maintenant()) / 1000)),
    fini: () => maintenant() >= fin,
  };
}

export function formaterDuree(secondes: number): string {
  return `${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, '0')}`;
}

let audio: AudioContext | null = null;

/** Vibration + bip de fin de repos. Chaque API est optionnelle. */
export function alerterFinRepos(): void {
  try {
    navigator.vibrate?.([300, 100, 300]);
  } catch {
    /* vibration indisponible */
  }
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.3);
  } catch {
    /* son indisponible */
  }
}

/** Garde l'écran allumé (Wake Lock), ré-acquis au retour sur l'app. Renvoie la fonction de libération. */
export async function garderEcranAllume(): Promise<() => void> {
  const wl = (navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } }).wakeLock;
  if (!wl) return () => {};
  let verrou: { release(): Promise<void> } | null = null;
  const acquerir = async () => {
    try {
      verrou = await wl.request('screen');
    } catch {
      verrou = null;
    }
  };
  const surVisibilite = () => {
    if (document.visibilityState === 'visible') void acquerir();
  };
  await acquerir();
  document.addEventListener('visibilitychange', surVisibilite);
  return () => {
    document.removeEventListener('visibilitychange', surVisibilite);
    void verrou?.release().catch(() => {});
  };
}
