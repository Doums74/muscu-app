/**
 * Valide programme.json et prochaine-seance.json d'un dossier muscu-data,
 * et réécrit la séance corrigée par les garde-fous.
 * Usage : npx tsx scripts/valider.ts <chemin-muscu-data>
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validerProgramme, validerSeance } from '../src/domaine/gardefous';
import type { SeanceRealisee } from '../src/domaine/types';

function lireJson(chemin: string): unknown {
  return JSON.parse(readFileSync(chemin, 'utf-8'));
}

export function valider(dossier: string): { ok: boolean; messages: string[] } {
  const messages: string[] = [];
  const chemin = (nom: string) => join(dossier, nom);

  if (!existsSync(chemin('programme.json'))) return { ok: false, messages: ['programme.json introuvable.'] };

  let programmeBrut: unknown;
  try {
    programmeBrut = lireJson(chemin('programme.json'));
  } catch {
    return { ok: false, messages: ['programme.json : JSON invalide.'] };
  }
  const { programme, erreurs } = validerProgramme(programmeBrut);
  if (!programme) return { ok: false, messages: erreurs };
  messages.push(`Programme ${programme.blocId} : OK.`);

  if (!existsSync(chemin('prochaine-seance.json'))) return { ok: true, messages };

  const historique = existsSync(chemin('historique.json')) ? (lireJson(chemin('historique.json')) as SeanceRealisee[]) : [];
  let seanceBrute: unknown;
  try {
    seanceBrute = lireJson(chemin('prochaine-seance.json'));
  } catch {
    return { ok: false, messages: [...messages, 'prochaine-seance.json : JSON invalide.'] };
  }

  const { seance, avertissements } = validerSeance(seanceBrute, historique);
  messages.push(...avertissements);
  if (!seance) return { ok: false, messages };
  if (seance.blocId !== programme.blocId) {
    messages.push(`La séance vise le bloc « ${seance.blocId} » mais le programme est « ${programme.blocId} ».`);
    return { ok: false, messages };
  }

  if (avertissements.length) {
    writeFileSync(chemin('prochaine-seance.json'), JSON.stringify(seance, null, 2) + '\n');
    messages.push('prochaine-seance.json corrigé.');
  } else {
    messages.push(`Séance ${seance.id} : OK.`);
  }
  return { ok: true, messages };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const dossier = process.argv[2];
  if (!dossier) {
    console.error('Usage : npx tsx scripts/valider.ts <chemin-muscu-data>');
    process.exit(2);
  }
  const { ok, messages } = valider(resolve(dossier));
  for (const m of messages) console.log(m);
  console.log(ok ? '✅ Validation réussie.' : '❌ Validation échouée.');
  process.exit(ok ? 0 : 1);
}
