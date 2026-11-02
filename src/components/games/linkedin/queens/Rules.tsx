export function Rules() {
  return (
    <details className="mt-6 text-sm text-flexoki-base-700 dark:text-flexoki-base-300">
      <summary className="cursor-pointer font-serif text-flexoki-ink dark:text-flexoki-base-50">
        Cómo se juega
      </summary>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        <li>Coloca una reina (♛) en cada fila, en cada columna y en cada región de color.</li>
        <li>Dos reinas no pueden tocarse en diagonal (esquina con esquina).</li>
        <li>Toca una casilla para ir cambiándola: vacía → × (nota) → ♛ (reina) → vacía.</li>
        <li>El tablero marca en rojo los choques según juegas. Está resuelto cuando no queda ninguno.</li>
      </ul>
    </details>
  );
}
