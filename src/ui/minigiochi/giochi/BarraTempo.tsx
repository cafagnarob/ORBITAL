/**
 * BarraTempo.tsx — Il tempo che resta in un minigioco (diventa rossa alla fine).
 */
import stili from "./giochi.module.css";

export function BarraTempo({ trascorso, durata }: { trascorso: number; durata: number }) {
  const resto = Math.max(0, 1 - trascorso / durata);
  return (
    <div
      className={`${stili.tempo} ${resto < 0.25 ? stili.urgente : ""}`}
      role="progressbar"
      aria-label="Tempo rimasto"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(resto * 100)}
    >
      <span style={{ width: `${resto * 100}%` }} />
    </div>
  );
}
