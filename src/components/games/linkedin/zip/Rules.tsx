export function Rules() {
  return (
    <details className="mt-6 text-sm text-flexoki-base-700 dark:text-flexoki-base-300">
      <summary className="cursor-pointer font-serif text-flexoki-ink dark:text-flexoki-base-50">
        Cómo se juega
      </summary>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        <li>Dibuja un solo camino, sin cortes, que pase una vez por cada casilla de la cuadrícula de 6×6.</li>
        <li>Pasa por las casillas con número en orden: primero el 1, luego el 2, luego el 3 y así.</li>
        <li>Muévete solo arriba, abajo, izquierda o derecha entre casillas vecinas. Nada de diagonales.</li>
        <li>Toca la casilla del 1 para empezar y luego una vecina del final del camino para alargarlo.</li>
        <li>Toca otra vez el final para deshacer el último paso, o cualquier casilla anterior para volver hasta ella.</li>
      </ul>
    </details>
  );
}
