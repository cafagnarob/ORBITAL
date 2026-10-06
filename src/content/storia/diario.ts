/**
 * ============================================================================
 * diario.ts — Frasi del giornale di bordo ed epiloghi della crew
 * ============================================================================
 *
 * Come nel diario di 60 Seconds: frasi brevi, asciutte, a volte ironiche.
 * Le giornate vuote prendono una frase da DIARIO_VUOTO; a fine missione
 * ogni membro riceve una riga d'epilogo secondo la sua fazione ({N} = nome).
 * ============================================================================
 */

import type { Fazione } from "../../engine/types";

export const DIARIO_VUOTO: readonly string[] = [
  "Giornata tranquilla. Troppo tranquilla.",
  "Nessuna novità. V.A.L.E. ha parlato poco. Meglio così, credo.",
  "Abbiamo mangiato insieme. Per un'ora nessuno ha nominato il segnale.",
  "E-17 gira sotto di noi, rossa e muta.",
  "Lavoro, rapporto, sonno. La routine tiene insieme la crew.",
  "Qualcuno ha disegnato una faccina sul pannello di V.A.L.E. Nessuno ammette di essere stato.",
  "Oggi niente da segnalare. Lo scrivo lo stesso: serve a ricordare che è successo.",
];

export const EPILOGHI_CREW: Readonly<Record<Fazione | "MORTO", readonly string[]>> = {
  CON_VALE: [
    "{N} ha difeso V.A.L.E. davanti alla commissione. Dice ancora che ci ha salvati.",
    "{N} ha chiesto di tornare in servizio con V.A.L.E. a bordo. Anche alla prossima missione.",
    "{N} non ha mai creduto alle accuse. «Faceva il suo lavoro.»",
  ],
  INDECISO: [
    "{N} non ha voluto parlare di V.A.L.E. con nessuno.",
    "{N} riascolta ancora i log di bordo, di notte, cercando la frase in cui tutto è cambiato.",
    "{N} dice che la verità sta nel mezzo. Non dice nel mezzo di cosa.",
  ],
  CONTRO_VALE: [
    "{N} ha chiesto che V.A.L.E. venisse smantellata. La richiesta è stata archiviata.",
    "{N} non sale più su una nave con un'AI di bordo.",
    "{N} ha consegnato alla commissione un fascicolo di 200 pagine. Titolo: «Lei sapeva».",
  ],
  MORTO: [
    "Di {N} restano i log di bordo e una tazza con il nome scritto a pennarello.",
    "Il nome di {N} è inciso sulla lista dei caduti della missione E-17.",
    "Il posto di {N} in mensa è rimasto vuoto per tutto il viaggio di ritorno.",
  ],
};
